import { MongoClient } from 'mongodb';
import embeddingService from './embedding.service.js';

class VectorSearchService {
  constructor() {
    this.client = null;
    this.db = null;
    this.collection = null;
    this.indexName = 'vector_index';
  }

  /**
   * Initialize MongoDB connection for vector search
   */
  async initialize() {
    try {
      if (!this.client) {
        this.client = new MongoClient(process.env.MONGODB_URL);
        await this.client.connect();
        this.db = this.client.db();
        this.collection = this.db.collection('documents');
      }
      return true;
    } catch (error) {
      console.error('Vector search initialization error:', error);
      throw error;
    }
  }

  /**
   * Search for similar document chunks using vector search
   * @param {string} query - Search query
   * @param {string} userId - User ID for access control
   * @param {Object} options - Search options
   * @returns {Promise<Array>} - Similar chunks with scores
   */
  async searchSimilarChunks(query, userId, options = {}) {
    try {
      await this.initialize();
      
      const {
        limit = 5,
        numCandidates = 50,
        notebookId = null,
        minScore = 0.7
      } = options;

      // Generate embedding for the query
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      // Build the aggregation pipeline
      const pipeline = [
        {
          $match: {
            owner: { $eq: userId }, // Convert string to ObjectId if needed
            status: 'completed'
          }
        },
        // Unwind chunks for vector search
        {
          $unwind: '$chunks'
        },
        // Vector search stage
        {
          $vectorSearch: {
            index: this.indexName,
            queryVector: queryEmbedding,
            path: 'chunks.embedding',
            numCandidates: numCandidates,
            limit: limit * 2, // Get more candidates to filter
          }
        },
        // Add similarity score
        {
          $addFields: {
            similarity: {
              $meta: 'vectorSearchScore'
            }
          }
        },
        // Filter by minimum score
        {
          $match: {
            similarity: { $gte: minScore }
          }
        },
        // Filter by notebook if specified
        ...(notebookId ? [{ $match: { notebook: notebookId } }] : []),
        // Project necessary fields
        {
          $project: {
            _id: 1,
            title: 1,
            originalFilename: 1,
            fileType: 1,
            notebook: 1,
            'chunks.text': 1,
            'chunks.chunkIndex': 1,
            similarity: 1,
            createdAt: 1
          }
        },
        // Sort by similarity score
        {
          $sort: { similarity: -1 }
        },
        // Limit final results
        {
          $limit: limit
        }
      ];

      const results = await this.collection.aggregate(pipeline).toArray();
      
      return results.map(result => ({
        documentId: result._id,
        title: result.title,
        filename: result.originalFilename,
        fileType: result.fileType,
        notebook: result.notebook,
        text: result.chunks.text,
        chunkIndex: result.chunks.chunkIndex,
        similarity: result.similarity,
        createdAt: result.createdAt
      }));

    } catch (error) {
      console.error('Vector search error:', error);
      throw new Error(`Vector search failed: ${error.message}`);
    }
  }

  /**
   * Search within a specific notebook
   * @param {string} query - Search query
   * @param {string} notebookId - Notebook ID
   * @param {string} userId - User ID
   * @param {Object} options - Search options
   * @returns {Promise<Array>} - Search results
   */
  async searchInNotebook(query, notebookId, userId, options = {}) {
    return this.searchSimilarChunks(query, userId, {
      ...options,
      notebookId
    });
  }

  /**
   * Get document chunks for a specific document
   * @param {string} documentId - Document ID
   * @param {string} userId - User ID for access control
   * @returns {Promise<Array>} - Document chunks
   */
  async getDocumentChunks(documentId, userId) {
    try {
      await this.initialize();

      const document = await this.collection.findOne({
        _id: documentId,
        owner: userId,
        status: 'completed'
      }, {
        projection: {
          chunks: 1,
          title: 1,
          originalFilename: 1
        }
      });

      if (!document) {
        throw new Error('Document not found or access denied');
      }

      return document.chunks.map((chunk, index) => ({
        text: chunk.text,
        chunkIndex: index,
        startPosition: chunk.startPosition,
        endPosition: chunk.endPosition
      }));

    } catch (error) {
      console.error('Get document chunks error:', error);
      throw error;
    }
  }

  /**
   * Create vector search index (run this once during setup)
   * @returns {Promise<boolean>} - Success status
   */
  async createVectorIndex() {
    try {
      await this.initialize();

      const indexSpec = {
        name: this.indexName,
        definition: {
          mappings: {
            dynamic: false,
            fields: {
              'chunks.embedding': {
                dimensions: 384, // MiniLM-L6-v2 embedding size
                similarity: 'cosine',
                type: 'knnVector'
              }
            }
          }
        }
      };

      // Note: This requires MongoDB Atlas and the Atlas Search API
      // In production, create the index through Atlas UI or Atlas CLI
      console.log('Vector index specification:', JSON.stringify(indexSpec, null, 2));
      console.log('Please create this index in MongoDB Atlas Search');
      
      return true;

    } catch (error) {
      console.error('Create vector index error:', error);
      throw error;
    }
  }

  /**
   * Test vector search functionality
   * @param {string} userId - User ID for testing
   * @returns {Promise<Object>} - Test results
   */
  async testVectorSearch(userId) {
    try {
      const testQuery = 'machine learning artificial intelligence';
      const results = await this.searchSimilarChunks(testQuery, userId, { limit: 3 });
      
      return {
        success: true,
        query: testQuery,
        resultsCount: results.length,
        results: results.map(r => ({
          title: r.title,
          similarity: r.similarity,
          textPreview: r.text.substring(0, 100) + '...'
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.collection = null;
    }
  }
}

export default new VectorSearchService();