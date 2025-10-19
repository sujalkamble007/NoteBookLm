import Document from '../models/Document.model.js';
import Notebook from '../models/Notebook.model.js';
import User from '../models/User.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { DocumentParser } from '../utils/documentParser.js';
import groqService from '../utils/groq.service.js';
import { deleteFromCloudinary, getCloudinaryPublicId } from '../middleware/cloudinary.middleware.js';
import path from 'path';
import fs from 'fs/promises';

// Upload and process document (with Cloudinary)
export const uploadDocument = asyncHandler(async (req, res) => {
  const { notebookId } = req.body;
  const files = req.files;

  if (!files || files.length === 0) {
    throw new ApiError(400, "No files uploaded");
  }

  if (!notebookId) {
    throw new ApiError(400, "Notebook ID is required");
  }

  try {
    const uploadedDocuments = [];

    for (const file of files) {
      // Get file information
      const fileType = path.extname(file.originalname).substring(1).toLowerCase();
      
      // Generate checksum from file metadata (since file is already on Cloudinary)
      const checksum = `${file.size}-${file.originalname}`;
      
      // Check for existing document with same checksum in the notebook
      const existingDoc = await Document.findOne({ 
        checksum, 
        notebook: notebookId,
        status: { $ne: 'deleted' }
      });
      
      if (existingDoc) {
        // Delete the uploaded file from Cloudinary since it's a duplicate
        const publicId = getCloudinaryPublicId(file.path);
        if (publicId) {
          await deleteFromCloudinary(publicId, 'auto');
        }
        continue; // Skip this file, don't throw error for batch uploads
      }

      // Create document record
      const document = await Document.create({
        title: file.originalname,
        originalName: file.originalname,
        filename: file.filename,
        fileType,
        mimeType: file.mimetype,
        fileSize: file.size,
        fileUrl: file.path, // Cloudinary URL
        cloudinaryPublicId: getCloudinaryPublicId(file.path),
        notebook: notebookId,
        uploadedBy: req.user._id,
        checksum,
        status: 'processing'
      });

      uploadedDocuments.push(document);

      // Start background processing
      processDocumentAsync(document._id, file.path, fileType, file.mimetype);
    }

    // Update user's document count
    await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { totalDocuments: uploadedDocuments.length } }
    );

    return res
      .status(201)
      .json(new ApiResponse(201, uploadedDocuments, 
        `${uploadedDocuments.length} document(s) uploaded successfully`));

  } catch (error) {
    // Clean up uploaded files from Cloudinary in case of error
    if (files && files.length > 0) {
      for (const file of files) {
        const publicId = getCloudinaryPublicId(file.path);
        if (publicId) {
          await deleteFromCloudinary(publicId, 'auto').catch(console.error);
        }
      }
    }
    throw error;
  }
});

// Background document processing with Groq AI
async function processDocumentAsync(documentId, cloudinaryUrl, fileType, mimeType) {
  try {
    const document = await Document.findById(documentId);
    if (!document) return;

    // Step 1: Extract text content from Cloudinary URL
    document.processingStatus.textExtraction = 'processing';
    await document.save();

    // Download file from Cloudinary for processing
    const extractionResult = await DocumentParser.extractTextFromUrl(cloudinaryUrl, fileType, mimeType);
    
    document.extractedText = extractionResult.text;
    document.extractedData = extractionResult.structuredData;
    document.wordCount = extractionResult.metadata?.wordCount || 0;
    document.pageCount = extractionResult.metadata?.pages || 0;
    document.processingStatus.textExtraction = 'completed';

    // Step 2: AI Analysis using Groq
    document.processingStatus.aiAnalysis = 'processing';
    await document.save();

    const aiAnalysis = await groqService.analyzeDocument(extractionResult.text, {
      type: fileType,
      language: 'english'
    });
    
    // Convert Groq analysis to schema format
    document.keyPoints = aiAnalysis.mainConcepts.map((concept, index) => ({
      point: concept,
      importance: Math.max(0.1, 1 - (index * 0.15)),
      context: aiAnalysis.summary
    }));

    document.entities = [
      ...aiAnalysis.entities.people.map(person => ({ text: person, type: 'PERSON', confidence: 0.9 })),
      ...aiAnalysis.entities.places.map(place => ({ text: place, type: 'LOCATION', confidence: 0.9 })),
      ...aiAnalysis.entities.organizations.map(org => ({ text: org, type: 'ORGANIZATION', confidence: 0.9 })),
      ...aiAnalysis.entities.dates.map(date => ({ text: date, type: 'DATE', confidence: 0.9 }))
    ];

    document.aiSummary = aiAnalysis.summary;
    document.searchKeywords = aiAnalysis.keyTopics;
    document.processingStatus.aiAnalysis = 'completed';

    // Step 3: Create text chunks for RAG
    document.processingStatus.vectorization = 'processing';
    const chunks = DocumentParser.chunkText(extractionResult.text);
    
    // Store chunks for Groq-based similarity search
    document.embeddings = chunks.map((chunk, index) => ({
      chunkId: chunk.chunkId,
      text: chunk.text,
      vector: [], // Groq doesn't provide embeddings, we'll use text similarity
      metadata: {
        chunkIndex: index,
        startChar: chunk.startIndex,
        endChar: chunk.endIndex,
        keyTopics: aiAnalysis.keyTopics.slice(0, 3) // Top 3 topics for this chunk
      }
    }));

    document.processingStatus.vectorization = 'completed';
    document.status = 'active';
    
    await document.save();

    console.log(`Document ${documentId} processed successfully with Groq AI`);

  } catch (error) {
    console.error(`Error processing document ${documentId}:`, error);
    
    const document = await Document.findById(documentId);
    if (document) {
      document.status = 'error';
      document.addProcessingError('processing', error.message);
      await document.save();
    }
  }
}

// Process document manually (if auto-processing failed)
export const processDocument = asyncHandler(async (req, res) => {
  const { documentId } = req.params;

  const document = await Document.findById(documentId).populate('notebook');

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  // Check permissions
  if (!document.notebook.hasAccess(req.user._id, 'editor')) {
    throw new ApiError(403, "You don't have permission to process this document");
  }

  if (document.status === 'processing') {
    throw new ApiError(400, "Document is already being processed");
  }

  // Reset processing status
  document.status = 'processing';
  document.processingStatus = {
    textExtraction: 'pending',
    aiAnalysis: 'pending', 
    vectorization: 'pending'
  };
  document.processingErrors = [];
  await document.save();

  // Start processing
  processDocumentAsync(document._id, document.fileUrl, document.fileType, document.mimeType);

  return res
    .status(200)
    .json(new ApiResponse(200, document, "Document processing started"));
});

// Generate embeddings for document
export const generateDocumentEmbeddings = asyncHandler(async (req, res) => {
  const { documentId } = req.params;

  const document = await Document.findById(documentId).populate('notebook');

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  if (!document.notebook.hasAccess(req.user._id, 'editor')) {
    throw new ApiError(403, "You don't have permission to modify this document");
  }

  if (!document.extractedText) {
    throw new ApiError(400, "Document text must be extracted first");
  }

  try {
    // Re-chunk and analyze text with latest AI
    const chunks = DocumentParser.chunkText(document.extractedText);
    const aiAnalysis = await groqService.analyzeDocument(document.extractedText);

    document.embeddings = chunks.map((chunk, index) => ({
      chunkId: chunk.chunkId,
      text: chunk.text,
      vector: [],
      metadata: {
        chunkIndex: index,
        startChar: chunk.startIndex,
        endChar: chunk.endIndex,
        keyTopics: aiAnalysis.keyTopics.slice(0, 3)
      }
    }));

    document.processingStatus.vectorization = 'completed';
    await document.save();

    return res
      .status(200)
      .json(new ApiResponse(200, { 
        chunkCount: chunks.length,
        embeddingCount: document.embeddings.length 
      }, "Embeddings generated successfully"));

  } catch (error) {
    throw new ApiError(500, `Failed to generate embeddings: ${error.message}`);
  }
});

// Get documents for a notebook (renamed from getDocuments)
export const getDocumentsByNotebook = asyncHandler(async (req, res) => {
  const { notebookId } = req.params;
  const { page = 1, limit = 10, type, status = 'active' } = req.query;

  // Verify notebook access
  const notebook = await Notebook.findById(notebookId);
  if (!notebook) {
    throw new ApiError(404, "Notebook not found");
  }

  if (!notebook.hasAccess(req.user._id)) {
    throw new ApiError(403, "You don't have access to this notebook");
  }

  const query = { notebook: notebookId, status };
  if (type) query.fileType = type;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: [
      { path: 'uploadedBy', select: 'name avatar' }
    ]
  };

  const documents = await Document.paginate(query, options);

  return res
    .status(200)
    .json(new ApiResponse(200, documents, "Documents fetched successfully"));
});

// Get single document
export const getDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const document = await Document.findById(id)
    .populate('notebook', 'title owner collaborators')
    .populate('uploadedBy', 'name avatar');

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  // Check notebook access
  if (!document.notebook.hasAccess(req.user._id)) {
    throw new ApiError(403, "You don't have access to this document");
  }

  // Update access tracking
  document.lastAccessed = new Date();
  document.downloadCount += 1;
  await document.save();

  return res
    .status(200)
    .json(new ApiResponse(200, document, "Document fetched successfully"));
});

// Update document metadata
export const updateDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, tags } = req.body;

  const document = await Document.findById(id).populate('notebook');

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  // Check edit permissions
  if (!document.notebook.hasAccess(req.user._id, 'editor')) {
    throw new ApiError(403, "You don't have permission to edit this document");
  }

  const updateFields = {};
  if (title) updateFields.title = title.trim();
  if (tags) updateFields.searchKeywords = tags;

  const updatedDocument = await Document.findByIdAndUpdate(
    id,
    { $set: updateFields },
    { new: true, runValidators: true }
  ).populate('uploadedBy', 'name avatar');

  return res
    .status(200)
    .json(new ApiResponse(200, updatedDocument, "Document updated successfully"));
});

// Delete document
export const deleteDocument = asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  const { permanent = false } = req.query;

  const document = await Document.findById(documentId).populate('notebook');

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  // Check permissions (owner or notebook owner can delete)
  const canDelete = document.uploadedBy.toString() === req.user._id.toString() ||
                   document.notebook.owner.toString() === req.user._id.toString();

  if (!canDelete) {
    throw new ApiError(403, "You don't have permission to delete this document");
  }

  if (permanent) {
    // Delete file from Cloudinary
    try {
      if (document.cloudinaryPublicId) {
        await deleteFromCloudinary(document.cloudinaryPublicId, 'auto');
      }
    } catch (error) {
      console.error('Error deleting file from Cloudinary:', error);
    }

    await Document.findByIdAndDelete(documentId);
  } else {
    document.status = 'deleted';
    await document.save();
  }

  // Update user's document count
  await User.findByIdAndUpdate(
    document.uploadedBy,
    { $inc: { totalDocuments: -1 } }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, {}, permanent ? "Document deleted permanently" : "Document moved to trash"));
});

// Search documents using Groq AI ranking
export const searchDocuments = asyncHandler(async (req, res) => {
  const { query, notebookId, page = 1, limit = 10 } = req.body;

  if (!query) {
    throw new ApiError(400, "Search query is required");
  }

  let searchFilter = { status: 'active' };
  
  if (notebookId) {
    // Verify notebook access if searching within specific notebook
    const notebook = await Notebook.findById(notebookId);
    if (!notebook) {
      throw new ApiError(404, "Notebook not found");
    }

    if (!notebook.hasAccess(req.user._id)) {
      throw new ApiError(403, "You don't have access to this notebook");
    }
    
    searchFilter.notebook = notebookId;
  } else {
    // Search across all accessible notebooks
    const accessibleNotebooks = await Notebook.find({
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id }
      ]
    }).select('_id');
    
    searchFilter.notebook = { $in: accessibleNotebooks.map(nb => nb._id) };
  }

  try {
    // Get documents that might be relevant
    const documents = await Document.find(searchFilter)
      .populate('notebook', 'title')
      .populate('uploadedBy', 'name avatar')
      .select('title extractedText aiSummary keyPoints entities searchKeywords fileType createdAt notebook uploadedBy')
      .limit(50); // Get more docs for AI ranking

    if (documents.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, {
          docs: [],
          totalDocs: 0,
          page: parseInt(page),
          totalPages: 0
        }, "No documents found"));
    }

    // Use Groq to rank documents by relevance
    const rankedDocuments = await groqService.rankDocuments(query, documents);

    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedResults = rankedDocuments.slice(startIndex, endIndex);

    return res
      .status(200)
      .json(new ApiResponse(200, {
        docs: paginatedResults,
        totalDocs: rankedDocuments.length,
        page: parseInt(page),
        totalPages: Math.ceil(rankedDocuments.length / parseInt(limit))
      }, "Search completed successfully"));

  } catch (error) {
    console.error('Search error:', error);
    
    // Fallback to basic search if AI ranking fails
    const searchResults = await Document.find({
      ...searchFilter,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { extractedText: { $regex: query, $options: 'i' } },
        { searchKeywords: { $in: [new RegExp(query, 'i')] } }
      ]
    })
    .populate('notebook', 'title')
    .populate('uploadedBy', 'name avatar')
    .sort({ createdAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));

    const totalDocs = await Document.countDocuments({
      ...searchFilter,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { extractedText: { $regex: query, $options: 'i' } },
        { searchKeywords: { $in: [new RegExp(query, 'i')] } }
      ]
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {
        docs: searchResults,
        totalDocs,
        page: parseInt(page),
        totalPages: Math.ceil(totalDocs / parseInt(limit))
      }, "Search completed (fallback mode)"));
  }
});

// Get document processing status
export const getProcessingStatus = asyncHandler(async (req, res) => {
  const { documentId } = req.params;

  const document = await Document.findById(documentId)
    .select('processingStatus processingErrors status')
    .populate('notebook', 'owner collaborators');

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  if (!document.notebook.hasAccess(req.user._id)) {
    throw new ApiError(403, "You don't have access to this document");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {
      processingStatus: document.processingStatus,
      errors: document.processingErrors,
      status: document.status,
      isComplete: document.isProcessingComplete()
    }, "Processing status fetched successfully"));
});