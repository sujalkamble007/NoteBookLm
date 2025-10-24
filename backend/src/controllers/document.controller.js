import Document from '../models/Document.model.js';
import Notebook from '../models/Notebook.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import documentParser from '../services/documentParser.service.js';
import embeddingService from '../services/embedding.service.js';
import vectorSearchService from '../services/vectorSearch.service.js';
import groqService from '../services/groq.service.js';
import { cleanupUploadedFiles } from '../middleware/upload.middleware.js';

/**
 * Upload and process documents
 */
export const uploadDocuments = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  let processedFiles = [];

  try {
    const { notebookId, tags } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      throw new ApiError(400, 'No files uploaded');
    }

    // Validate notebook access if specified
    let notebook = null;
    if (notebookId) {
      notebook = await Notebook.findById(notebookId);
      if (!notebook) {
        throw new ApiError(404, 'Notebook not found');
      }
      
      // Check if user has edit access to the notebook
      if (!notebook.hasAccess(req.user._id, 'editor')) {
        throw new ApiError(403, 'No edit access to this notebook');
      }
    }

    const parsedTags = tags ? (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())) : [];

    // Process each file
    for (const file of files) {
      try {
        console.log(`Processing file: ${file.originalname}`);

        // Parse document content
        const content = await documentParser.parseDocument(file);
        if (!content || content.trim().length === 0) {
          throw new Error('No readable content found in document');
        }

        // Create document record
        const document = new Document({
          title: file.originalname.replace(/\.[^/.]+$/, ''), // Remove extension
          originalFilename: file.originalname,
          fileType: file.originalname.split('.').pop().toLowerCase(),
          fileSize: file.size,
          mimeType: file.mimetype,
          content,
          owner: req.user._id,
          notebook: notebook ? notebook._id : null,
          tags: parsedTags,
          status: 'processing'
        });

        await document.save();

        // Process content in background (chunk, embed, analyze)
        processDocumentContent(document._id, content)
          .catch(error => {
            console.error(`Background processing failed for document ${document._id}:`, error);
            // Update document status to failed
            Document.findByIdAndUpdate(document._id, {
              status: 'failed',
              processingError: error.message
            }).catch(console.error);
          });

        // Add to notebook if specified
        if (notebook) {
          await notebook.addDocument(document._id);
        }

        processedFiles.push({
          id: document._id,
          title: document.title,
          filename: document.originalFilename,
          size: document.fileSize,
          status: 'processing'
        });

      } catch (fileError) {
        console.error(`Failed to process file ${file.originalname}:`, fileError);
        // Continue with other files, but track the error
        processedFiles.push({
          filename: file.originalname,
          status: 'failed',
          error: fileError.message
        });
      }
    }

    // Cleanup uploaded files from disk
    cleanupUploadedFiles(files);

    const processingTime = Date.now() - startTime;

    return res.status(201).json(
      new ApiResponse(
        201, 
        {
          processedFiles,
          notebook: notebook ? { id: notebook._id, title: notebook.title } : null,
          processingTime
        },
        `${processedFiles.length} files uploaded and processing started`
      )
    );

  } catch (error) {
    // Cleanup uploaded files on error
    if (req.files) {
      cleanupUploadedFiles(req.files);
    }

    console.error('Upload documents error:', error);
    throw error;
  }
});

/**
 * Process document content in background
 * @param {string} documentId - Document ID
 * @param {string} content - Document content
 */
async function processDocumentContent(documentId, content) {
  try {
    const document = await Document.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    console.log(`Starting background processing for document: ${document.title}`);

    // 1. Generate text chunks
    const chunks = embeddingService.chunkText(content, 500, 50);
    console.log(`Generated ${chunks.length} chunks`);

    // 2. Generate embeddings for chunks
    const embeddings = await embeddingService.generateBatchEmbeddings(chunks);
    console.log(`Generated embeddings for ${embeddings.length} chunks`);

    // 3. Store chunks with embeddings
    chunks.forEach((chunk, index) => {
      document.addChunk(chunk, embeddings[index], index);
    });

    // 4. Generate AI-powered insights
    const [summary, keyInsights, suggestedQuestions] = await Promise.all([
      groqService.generateSummary(content).catch(() => ''),
      groqService.generateKeyInsights(content).catch(() => []),
      groqService.generateFollowUpQuestions(content).catch(() => [])
    ]);

    // 5. Update document with processed data
    document.summary = summary;
    document.keyInsights = keyInsights;
    document.suggestedQuestions = suggestedQuestions;
    document.status = 'completed';
    document.metadata.processingTime = Date.now() - document.createdAt.getTime();

    await document.save();

    console.log(`Completed processing for document: ${document.title}`);

  } catch (error) {
    console.error(`Background processing error for document ${documentId}:`, error);
    throw error;
  }
}

/**
 * Query documents using vector search + LLM
 */
export const queryDocuments = asyncHandler(async (req, res) => {
  const { question, notebookId, limit = 5 } = req.body;

  if (!question || question.trim().length === 0) {
    throw new ApiError(400, 'Question is required');
  }

  try {
    // Validate notebook access if specified
    if (notebookId) {
      const notebook = await Notebook.findById(notebookId);
      if (!notebook) {
        throw new ApiError(404, 'Notebook not found');
      }
      
      if (!notebook.hasAccess(req.user._id, 'viewer')) {
        throw new ApiError(403, 'No access to this notebook');
      }
    }

    console.log(`Processing question: "${question}"`);

    // 1. Search for similar content using vector search
    const searchResults = await vectorSearchService.searchSimilarChunks(
      question,
      req.user._id,
      {
        limit: parseInt(limit),
        notebookId,
        minScore: 0.7
      }
    );

    if (searchResults.length === 0) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            answer: "I couldn't find any relevant information in your documents to answer this question.",
            sources: [],
            question,
            confidence: 0
          },
          'No relevant documents found'
        )
      );
    }

    console.log(`Found ${searchResults.length} relevant chunks`);

    // 2. Combine context from search results
    const context = searchResults
      .map(result => `Document: ${result.title}\nContent: ${result.text}`)
      .join('\n\n---\n\n');

    // 3. Generate answer using Groq API
    const answer = await groqService.generateAnswer(question, context);

    // 4. Prepare source information
    const sources = searchResults.map(result => ({
      documentId: result.documentId,
      title: result.title,
      filename: result.filename,
      fileType: result.fileType,
      chunkIndex: result.chunkIndex,
      similarity: Math.round(result.similarity * 100) / 100,
      textPreview: result.text.substring(0, 200) + (result.text.length > 200 ? '...' : '')
    }));

    // 5. Calculate confidence score based on similarity scores
    const avgSimilarity = searchResults.reduce((sum, r) => sum + r.similarity, 0) / searchResults.length;
    const confidence = Math.min(Math.round(avgSimilarity * 100), 95);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          answer,
          sources,
          question,
          confidence,
          context: process.env.NODE_ENV === 'development' ? context : undefined
        },
        'Answer generated successfully'
      )
    );

  } catch (error) {
    console.error('Query documents error:', error);
    throw new ApiError(500, `Failed to process query: ${error.message}`);
  }
});

/**
 * Get user's documents
 */
export const getUserDocuments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, notebookId, status = 'completed' } = req.query;

  let filter = {
    owner: req.user._id,
    status
  };

  if (notebookId) {
    filter.notebook = notebookId;
  }

  const documents = await Document.find(filter)
    .select('-content -chunks') // Exclude large fields
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('notebook', 'title description');

  const total = await Document.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        documents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      },
      'Documents retrieved successfully'
    )
  );
});

/**
 * Get document details
 */
export const getDocumentDetails = asyncHandler(async (req, res) => {
  const { documentId } = req.params;

  const document = await Document.findOne({
    _id: documentId,
    owner: req.user._id
  })
  .populate('notebook', 'title description')
  .select('-chunks.embedding'); // Exclude embedding arrays

  if (!document) {
    throw new ApiError(404, 'Document not found');
  }

  return res.status(200).json(
    new ApiResponse(200, document, 'Document details retrieved successfully')
  );
});

/**
 * Delete document
 */
export const deleteDocument = asyncHandler(async (req, res) => {
  const { documentId } = req.params;

  const document = await Document.findOneAndDelete({
    _id: documentId,
    owner: req.user._id
  });

  if (!document) {
    throw new ApiError(404, 'Document not found');
  }

  // Remove from notebook if associated
  if (document.notebook) {
    const notebook = await Notebook.findById(document.notebook);
    if (notebook) {
      await notebook.removeDocument(document._id);
    }
  }

  return res.status(200).json(
    new ApiResponse(200, { deletedId: document._id }, 'Document deleted successfully')
  );
});

/**
 * Test vector search functionality
 */
export const testVectorSearch = asyncHandler(async (req, res) => {
  const result = await vectorSearchService.testVectorSearch(req.user._id.toString());
  
  return res.status(200).json(
    new ApiResponse(200, result, 'Vector search test completed')
  );
});