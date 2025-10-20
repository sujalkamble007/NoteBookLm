import Document from '../models/Document.model.js';
import Notebook from '../models/Notebook.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import ragService from '../utils/rag.service.js';
import groqService from '../utils/groq.service.js';

/**
 * Chat with documents using enhanced RAG (Groq + Tavily + YouTube)
 */
export const chatWithDocuments = asyncHandler(async (req, res) => {
  console.log('🔥 Chat request received');
  console.log('📝 Request body:', req.body);
  console.log('👤 User:', req.user?._id);
  
  const { question, notebookId, documentIds = [], useEnhancedRAG = true } = req.body;

  if (!question?.trim()) {
    console.log('❌ No question provided');
    throw new ApiError(400, "Question is required");
  }

  if (!notebookId && documentIds.length === 0) {
    console.log('❌ No notebook ID or document IDs provided');
    throw new ApiError(400, "Either notebook ID or document IDs must be provided");
  }

  console.log('✅ Basic validation passed');
  console.log('📝 Question:', question);
  console.log('📁 Notebook ID:', notebookId);
  console.log('🔍 Enhanced RAG:', useEnhancedRAG);

  try {
    // Step 1: Verify access and get documents
    let documents = [];
    let notebook = null;
    
    if (notebookId) {
      // Handle "default" notebook case - create or find user's default notebook
      if (notebookId === 'default') {
        // Find user's default notebook or create one
        notebook = await Notebook.findOne({
          owner: req.user._id,
          title: 'My Documents'
        });
        
        if (!notebook) {
          notebook = await Notebook.create({
            title: 'My Documents',
            description: 'Default notebook for uploaded documents',
            owner: req.user._id,
            collaborators: []
          });
        }
      } else {
        // Verify notebook access for regular notebooks
        notebook = await Notebook.findById(notebookId);
        if (!notebook) {
          throw new ApiError(404, "Notebook not found");
        }
        
        if (!notebook.hasAccess(req.user._id)) {
          throw new ApiError(403, "You don't have access to this notebook");
        }
      }
      
      // Get all documents in the notebook
      documents = await Document.find({
        notebook: notebook._id,
        status: 'active',
        extractedText: { $exists: true, $ne: '' }
      }).select('title extractedText embeddings enhancedAnalysis keyPoints entities aiSummary');
      
    } else {
      // Get specific documents and verify access
      documents = await Document.find({
        _id: { $in: documentIds },
        status: 'active',
        extractedText: { $exists: true, $ne: '' }
      }).populate('notebook', 'owner collaborators')
        .select('title extractedText embeddings enhancedAnalysis keyPoints entities aiSummary notebook');
      
      // Verify access to each document
      for (const doc of documents) {
        if (!doc.notebook.hasAccess(req.user._id)) {
          throw new ApiError(403, `You don't have access to document: ${doc.title}`);
        }
      }
    }

    // Step 2: Find relevant document chunks using simple text similarity (if documents exist)
    let relevantChunks = [];
    if (documents.length > 0) {
      relevantChunks = await findRelevantChunks(question, documents);
    }

    // Step 3: Get enhanced context if available and requested
    let enhancedContext = {};
    if (useEnhancedRAG && documents.length > 0) {
      enhancedContext = aggregateEnhancedContext(documents);
    }

    // Step 4: Generate response using RAG service
    const chatResponse = await ragService.chatWithEnhancedContext(
      question,
      relevantChunks,
      enhancedContext,
      [] // Chat history - could be extended to store conversation history
    );

    // Step 5: Return response with metadata
    return res.status(200).json(new ApiResponse(200, {
      response: chatResponse.response,
      sources: {
        documents: relevantChunks.map(chunk => ({
          documentId: chunk.documentId,
          title: chunk.title,
          relevantText: chunk.text.substring(0, 200) + '...'
        })),
        webSources: chatResponse.sources?.filter(s => s.type === 'web') || [],
        videoSources: chatResponse.sources?.filter(s => s.type === 'video') || []
      },
      metadata: {
        documentsUsed: documents.length,
        chunksAnalyzed: relevantChunks.length,
        hasEnhancedContext: chatResponse.hasEnhancedContext,
        contextTypes: chatResponse.contextTypes,
        ragEnhanced: useEnhancedRAG && enhancedContext.hasEnhancedData
      }
    }, "Chat response generated successfully"));

  } catch (error) {
    console.error('Chat error:', error);
    throw new ApiError(500, `Chat failed: ${error.message}`);
  }
});

/**
 * Get document insights and suggestions
 */
export const getDocumentInsights = asyncHandler(async (req, res) => {
  const { documentId } = req.params;

  const document = await Document.findById(documentId)
    .populate('notebook', 'title owner collaborators')
    .select('title aiSummary keyPoints entities enhancedAnalysis extractedText');

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  if (!document.notebook.hasAccess(req.user._id)) {
    throw new ApiError(403, "You don't have access to this document");
  }

  // Generate conversation-style insights
  const insights = {
    summary: document.aiSummary,
    keyPoints: document.keyPoints,
    entities: document.entities,
    conversationalInsights: null,
    suggestedQuestions: [],
    relatedResources: {
      webSources: [],
      videos: []
    }
  };

  // Add enhanced insights if available
  if (document.enhancedAnalysis?.enhancedInsights) {
    insights.conversationalInsights = document.enhancedAnalysis.enhancedInsights.conversationalResponse;
    insights.suggestedQuestions = document.enhancedAnalysis.enhancedInsights.actionableInsights;
  }

  // Add related resources
  if (document.enhancedAnalysis?.realTimeSearch?.results) {
    insights.relatedResources.webSources = document.enhancedAnalysis.realTimeSearch.results
      .slice(0, 5)
      .map(result => ({
        title: result.title,
        url: result.url,
        summary: result.content.substring(0, 200) + '...'
      }));
  }

  if (document.enhancedAnalysis?.videoSuggestions?.videos) {
    insights.relatedResources.videos = document.enhancedAnalysis.videoSuggestions.videos
      .slice(0, 3)
      .map(video => ({
        title: video.title,
        url: video.url,
        embedUrl: video.embedUrl,
        channelTitle: video.channelTitle,
        thumbnails: video.thumbnails
      }));
  }

  return res.status(200).json(new ApiResponse(200, insights, "Document insights retrieved successfully"));
});

/**
 * Generate study materials from document
 */
export const generateStudyMaterials = asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  const { materialType = 'summary', includeQuiz = false } = req.body;

  const document = await Document.findById(documentId)
    .populate('notebook', 'title owner collaborators')
    .select('title extractedText enhancedAnalysis');

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  if (!document.notebook.hasAccess(req.user._id)) {
    throw new ApiError(403, "You don't have access to this document");
  }

  if (!document.extractedText) {
    throw new ApiError(400, "Document content not available for study material generation");
  }

  try {
    let studyMaterials = {};

    switch (materialType) {
      case 'summary':
        studyMaterials = await generateSummary(document);
        break;
      case 'mindmap':
        studyMaterials = await groqService.generateMindmap(document.extractedText);
        break;
      case 'podcast':
        studyMaterials = await groqService.generatePodcast(document.extractedText);
        break;
      default:
        throw new ApiError(400, "Invalid material type. Use: summary, mindmap, or podcast");
    }

    // Add quiz if requested
    if (includeQuiz) {
      studyMaterials.quiz = await generateQuiz(document.extractedText);
    }

    // Add enhanced context if available
    if (document.enhancedAnalysis?.enhancedInsights) {
      studyMaterials.enhancedContext = {
        conversationalInsights: document.enhancedAnalysis.enhancedInsights.conversationalResponse,
        learningPath: document.enhancedAnalysis.enhancedInsights.learningPath,
        furtherExploration: document.enhancedAnalysis.enhancedInsights.furtherExploration
      };
    }

    return res.status(200).json(new ApiResponse(200, {
      materialType,
      materials: studyMaterials,
      hasEnhancedContext: !!document.enhancedAnalysis?.enhancedInsights
    }, "Study materials generated successfully"));

  } catch (error) {
    console.error('Study materials generation error:', error);
    throw new ApiError(500, `Failed to generate study materials: ${error.message}`);
  }
});

/**
 * Helper Functions
 */

/**
 * Find relevant document chunks for a question using simple similarity
 */
async function findRelevantChunks(question, documents, maxChunks = 5) {
  const relevantChunks = [];

  for (const document of documents) {
    // Simple keyword matching for now (in production, use semantic similarity)
    const questionWords = question.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    
    if (document.embeddings && document.embeddings.length > 0) {
      // Use existing chunks
      for (const embedding of document.embeddings) {
        const chunkWords = embedding.text.toLowerCase().split(/\W+/);
        const matches = questionWords.filter(word => 
          chunkWords.some(chunkWord => chunkWord.includes(word) || word.includes(chunkWord))
        );
        
        if (matches.length > 0) {
          relevantChunks.push({
            documentId: document._id,
            title: document.title,
            text: embedding.text,
            relevanceScore: matches.length / questionWords.length,
            metadata: embedding.metadata
          });
        }
      }
    } else {
      // Use full document text
      const documentText = document.extractedText || '';
      const matches = questionWords.filter(word => 
        documentText.toLowerCase().includes(word)
      );
      
      if (matches.length > 0) {
        relevantChunks.push({
          documentId: document._id,
          title: document.title,
          text: documentText.substring(0, 2000), // First 2000 chars
          relevanceScore: matches.length / questionWords.length,
          metadata: { source: 'full_document' }
        });
      }
    }
  }

  // Sort by relevance and return top chunks
  return relevantChunks
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxChunks);
}

/**
 * Aggregate enhanced context from multiple documents
 */
function aggregateEnhancedContext(documents) {
  const enhancedContext = {
    hasEnhancedData: false,
    realTimeSearch: { enabled: false, results: [] },
    videoSuggestions: { enabled: false, videos: [] }
  };

  for (const document of documents) {
    if (document.enhancedAnalysis?.ragEnhanced) {
      enhancedContext.hasEnhancedData = true;
      
      if (document.enhancedAnalysis.realTimeSearch?.results) {
        enhancedContext.realTimeSearch.enabled = true;
        enhancedContext.realTimeSearch.results.push(...document.enhancedAnalysis.realTimeSearch.results);
      }
      
      if (document.enhancedAnalysis.videoSuggestions?.videos) {
        enhancedContext.videoSuggestions.enabled = true;
        enhancedContext.videoSuggestions.videos.push(...document.enhancedAnalysis.videoSuggestions.videos);
      }
    }
  }

  // Remove duplicates and limit results
  enhancedContext.realTimeSearch.results = enhancedContext.realTimeSearch.results
    .filter((result, index, arr) => arr.findIndex(r => r.url === result.url) === index)
    .slice(0, 10);
    
  enhancedContext.videoSuggestions.videos = enhancedContext.videoSuggestions.videos
    .filter((video, index, arr) => arr.findIndex(v => v.videoId === video.videoId) === index)
    .slice(0, 5);

  return enhancedContext;
}

/**
 * Generate summary with enhanced context
 */
async function generateSummary(document) {
  const prompt = `
Create a comprehensive summary of this document:

Title: ${document.title}
Content: ${document.extractedText.substring(0, 3000)}...

${document.enhancedAnalysis?.enhancedInsights?.conversationalResponse ? 
  `Enhanced Insights: ${document.enhancedAnalysis.enhancedInsights.conversationalResponse}` : ''}

Provide:
1. Executive Summary (2-3 sentences)
2. Key Points (bullet format)
3. Main Takeaways
4. Conclusion

Keep it clear and actionable.
  `;

  return await groqService.generateText(prompt, { maxTokens: 1024 });
}

/**
 * Generate quiz questions from document content
 */
async function generateQuiz(content) {
  const prompt = `
Based on this content, create a 5-question quiz:

${content.substring(0, 2000)}...

Format as JSON:
{
  "questions": [
    {
      "question": "What is...?",
      "type": "multiple_choice",
      "options": ["A", "B", "C", "D"],
      "correct": 0,
      "explanation": "Brief explanation"
    }
  ]
}

Mix question types: multiple choice, true/false, short answer.
  `;

  const response = await groqService.generateText(prompt, { maxTokens: 1024 });
  
  try {
    return JSON.parse(response);
  } catch (error) {
    return {
      questions: [{
        question: "What are the main topics covered in this document?",
        type: "short_answer",
        correct: "Various topics related to the document content",
        explanation: "This is a general question about the document's main themes."
      }]
    };
  }
}