import { HfInference } from "@huggingface/inference";

class EmbeddingService {
  constructor() {
    if (!process.env.HF_API_KEY) {
      throw new Error('HF_API_KEY is required');
    }
    this.hf = new HfInference(process.env.HF_API_KEY);
    this.model = "sentence-transformers/all-MiniLM-L6-v2"; // 384 dimensions
  }

  /**
   * Generate embedding for text
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} - Embedding vector
   */
  async generateEmbedding(text) {
    try {
      if (!text || typeof text !== 'string') {
        throw new Error('Text must be a non-empty string');
      }

      // Clean and truncate text if too long
      const cleanText = text.trim().substring(0, 512);
      
      const response = await this.hf.featureExtraction({
        model: this.model,
        inputs: cleanText,
      });

      // Response can be 2D array -> flatten to 1D
      const embedding = Array.isArray(response[0]) ? response[0] : response;
      
      if (!Array.isArray(embedding) || embedding.length === 0) {
        throw new Error('Invalid embedding response');
      }

      return embedding;
    } catch (error) {
      console.error('Embedding generation error:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   * @param {string[]} texts - Array of texts to embed
   * @returns {Promise<number[][]>} - Array of embedding vectors
   */
  async generateBatchEmbeddings(texts) {
    try {
      if (!Array.isArray(texts) || texts.length === 0) {
        throw new Error('Texts must be a non-empty array');
      }

      const embeddings = [];
      
      // Process in batches to avoid API rate limits
      const batchSize = 5;
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchPromises = batch.map(text => this.generateEmbedding(text));
        const batchResults = await Promise.all(batchPromises);
        embeddings.push(...batchResults);
        
        // Small delay between batches
        if (i + batchSize < texts.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return embeddings;
    } catch (error) {
      console.error('Batch embedding generation error:', error);
      throw error;
    }
  }

  /**
   * Split text into chunks for embedding
   * @param {string} text - Text to chunk
   * @param {number} chunkSize - Maximum characters per chunk
   * @param {number} overlap - Overlap between chunks
   * @returns {string[]} - Array of text chunks
   */
  chunkText(text, chunkSize = 500, overlap = 50) {
    if (!text || typeof text !== 'string') {
      return [];
    }

    const chunks = [];
    let start = 0;

    while (start < text.length) {
      let end = start + chunkSize;
      
      // Try to break at sentence boundary
      if (end < text.length) {
        const lastPeriod = text.lastIndexOf('.', end);
        const lastNewline = text.lastIndexOf('\n', end);
        const breakPoint = Math.max(lastPeriod, lastNewline);
        
        if (breakPoint > start + chunkSize * 0.5) {
          end = breakPoint + 1;
        }
      }

      chunks.push(text.substring(start, end).trim());
      start = end - overlap;
    }

    return chunks.filter(chunk => chunk.length > 0);
  }
}

export default new EmbeddingService();