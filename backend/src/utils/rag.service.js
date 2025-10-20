import axios from 'axios';
import { ApiError } from './ApiError.js';
import groqService from './groq.service.js';

class RAGService {
  constructor() {
    this.tavilyApiKey = process.env.TAVILY_API_KEY;
    this.youtubeApiKey = process.env.YOUTUBE_API_KEY;
    
    if (!this.tavilyApiKey) {
      console.warn('Tavily API key not found. Real-time search will be disabled.');
    }
    
    if (!this.youtubeApiKey) {
      console.warn('YouTube API key not found. Video suggestions will be disabled.');
    }
  }

  /**
   * Enhanced document analysis with real-time search and video suggestions
   * @param {string} content - Document content
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} - Enhanced analysis results
   */
  async enhancedDocumentAnalysis(content, options = {}) {
    try {
      const { 
        enableRealTimeSearch = true, 
        enableVideoSuggestions = true,
        maxSearchResults = 5,
        maxVideoResults = 3 
      } = options;

      // Step 1: Basic document analysis with Groq
      console.log('🔍 Starting document analysis with Groq...');
      const basicAnalysis = await groqService.analyzeDocument(content);

      // Step 2: Extract search queries from the content
      const searchQueries = await this.generateSearchQueries(content, basicAnalysis.keyTopics);

      // Step 3: Real-time search with Tavily (if enabled and available)
      let realTimeSearchResults = [];
      if (enableRealTimeSearch && this.tavilyApiKey && searchQueries.length > 0) {
        console.log('🌐 Performing real-time search with Tavily...');
        realTimeSearchResults = await this.performTavilySearch(searchQueries.slice(0, 3), maxSearchResults);
      }

      // Step 4: YouTube video suggestions (if enabled and available)
      let videoSuggestions = [];
      if (enableVideoSuggestions && this.youtubeApiKey && searchQueries.length > 0) {
        console.log('🎥 Searching for related YouTube videos...');
        videoSuggestions = await this.searchYouTubeVideos(searchQueries.slice(0, 2), maxVideoResults);
      }

      // Step 5: Enhanced synthesis using all collected information
      console.log('🧠 Synthesizing enhanced insights...');
      const enhancedInsights = await this.synthesizeEnhancedInsights(
        content, 
        basicAnalysis, 
        realTimeSearchResults, 
        videoSuggestions
      );

      return {
        ...basicAnalysis,
        enhancedInsights,
        realTimeSearch: {
          enabled: enableRealTimeSearch && !!this.tavilyApiKey,
          results: realTimeSearchResults,
          queries: searchQueries
        },
        videoSuggestions: {
          enabled: enableVideoSuggestions && !!this.youtubeApiKey,
          videos: videoSuggestions
        },
        processingTimestamp: new Date().toISOString(),
        ragEnhanced: true
      };

    } catch (error) {
      console.error('Enhanced document analysis error:', error);
      // Fallback to basic analysis if enhancement fails
      const basicAnalysis = await groqService.analyzeDocument(content);
      return {
        ...basicAnalysis,
        enhancedInsights: null,
        realTimeSearch: { enabled: false, results: [], queries: [] },
        videoSuggestions: { enabled: false, videos: [] },
        processingTimestamp: new Date().toISOString(),
        ragEnhanced: false,
        error: 'Enhancement failed, using basic analysis'
      };
    }
  }

  /**
   * Generate search queries from document content
   * @param {string} content - Document content
   * @param {Array} keyTopics - Key topics from basic analysis
   * @returns {Promise<Array>} - Array of search queries
   */
  async generateSearchQueries(content, keyTopics = []) {
    try {
      const prompt = `
Based on this document content and key topics, generate 3-5 specific search queries that would help find current, relevant information to enhance understanding of this content.

Document excerpt: ${content.substring(0, 1000)}...
Key topics: ${keyTopics.join(', ')}

Generate search queries that would find:
1. Recent developments or updates related to these topics
2. Related concepts or technologies
3. Expert opinions or analysis
4. Practical applications or examples

Format as JSON array: ["query1", "query2", "query3"]
Keep queries specific and focused (2-6 words each).
      `;

      const response = await groqService.generateText(prompt, {
        maxTokens: 512,
        temperature: 0.7
      });

      try {
        const queries = JSON.parse(response);
        return Array.isArray(queries) ? queries : [];
      } catch (parseError) {
        // Fallback: extract queries from key topics
        return keyTopics.slice(0, 3).map(topic => topic);
      }
    } catch (error) {
      console.error('Error generating search queries:', error);
      return keyTopics.slice(0, 3);
    }
  }

  /**
   * Perform real-time search using Tavily API
   * @param {Array} queries - Search queries
   * @param {number} maxResults - Maximum results per query
   * @returns {Promise<Array>} - Search results
   */
  async performTavilySearch(queries, maxResults = 5) {
    if (!this.tavilyApiKey) {
      return [];
    }

    const allResults = [];

    for (const query of queries) {
      try {
        const response = await axios.post('https://api.tavily.com/search', {
          api_key: this.tavilyApiKey,
          query: query,
          search_depth: 'basic',
          include_answer: true,
          include_domains: [],
          exclude_domains: ['youtube.com', 'tiktok.com'], // Exclude video platforms from web search
          max_results: maxResults
        });

        if (response.data && response.data.results) {
          const results = response.data.results.map(result => ({
            query: query,
            title: result.title,
            url: result.url,
            content: result.content,
            score: result.score || 0.5,
            publishedDate: result.published_date || null,
            source: 'tavily'
          }));

          allResults.push(...results);
        }
      } catch (error) {
        console.error(`Tavily search error for query "${query}":`, error.message);
      }
    }

    // Sort by score and return top results
    return allResults
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults * queries.length);
  }

  /**
   * Search for relevant YouTube videos
   * @param {Array} queries - Search queries  
   * @param {number} maxResults - Maximum videos per query
   * @returns {Promise<Array>} - Video suggestions
   */
  async searchYouTubeVideos(queries, maxResults = 3) {
    if (!this.youtubeApiKey) {
      return [];
    }

    const allVideos = [];

    for (const query of queries) {
      try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
          params: {
            part: 'snippet',
            q: query,
            type: 'video',
            maxResults: maxResults,
            order: 'relevance',
            videoDuration: 'medium', // Prefer 4-20 minute videos
            key: this.youtubeApiKey
          }
        });

        if (response.data && response.data.items) {
          const videos = response.data.items.map(item => ({
            query: query,
            videoId: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
            thumbnails: item.snippet.thumbnails,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`,
            source: 'youtube'
          }));

          allVideos.push(...videos);
        }
      } catch (error) {
        console.error(`YouTube search error for query "${query}":`, error.message);
      }
    }

    return allVideos.slice(0, maxResults * queries.length);
  }

  /**
   * Synthesize enhanced insights using all collected information
   * @param {string} originalContent - Original document content
   * @param {Object} basicAnalysis - Basic Groq analysis
   * @param {Array} searchResults - Real-time search results
   * @param {Array} videoSuggestions - YouTube video suggestions
   * @returns {Promise<Object>} - Enhanced insights
   */
  async synthesizeEnhancedInsights(originalContent, basicAnalysis, searchResults, videoSuggestions) {
    try {
      const searchContext = searchResults.length > 0 
        ? searchResults.map(result => `${result.title}: ${result.content}`).join('\n\n')
        : 'No real-time search results available.';

      const videoContext = videoSuggestions.length > 0
        ? videoSuggestions.map(video => `${video.title}: ${video.description}`).join('\n\n')
        : 'No video suggestions available.';

      const prompt = `
You are an AI assistant that provides comprehensive, chat-like responses similar to ChatGPT or Claude.

ORIGINAL DOCUMENT ANALYSIS:
${JSON.stringify(basicAnalysis, null, 2)}

REAL-TIME SEARCH RESULTS:
${searchContext}

RELATED VIDEOS:
${videoContext}

ORIGINAL DOCUMENT CONTENT (first 1000 chars):
${originalContent.substring(0, 1000)}...

Based on all this information, provide a comprehensive, conversational analysis that:

1. **Contextualizes** the original document with current information
2. **Explains** how the real-time search results relate to the document
3. **Suggests** learning paths using the video resources
4. **Identifies** gaps or areas for deeper exploration
5. **Provides** actionable insights and recommendations

Respond in a natural, helpful manner as if you're having a conversation with the user. Be comprehensive but accessible, like a knowledgeable assistant explaining complex topics.

Format your response as JSON with this structure:
{
  "conversationalResponse": "A natural, chat-like response explaining everything...",
  "keyConnections": ["How search results connect to the document"],
  "learningPath": ["Suggested order for exploring the videos and resources"],
  "actionableInsights": ["Specific things the user can do with this information"],
  "furtherExploration": ["Topics or questions for deeper investigation"],
  "confidenceScore": 0.85
}
      `;

      const response = await groqService.generateText(prompt, {
        maxTokens: 2048,
        temperature: 0.7
      });

      try {
        return JSON.parse(response);
      } catch (parseError) {
        // Fallback to a basic structured response
        return {
          conversationalResponse: response,
          keyConnections: searchResults.slice(0, 3).map(r => r.title),
          learningPath: videoSuggestions.slice(0, 3).map(v => v.title),
          actionableInsights: basicAnalysis.suggestedQuestions || [],
          furtherExploration: basicAnalysis.keyTopics || [],
          confidenceScore: 0.6
        };
      }
    } catch (error) {
      console.error('Error synthesizing enhanced insights:', error);
      return {
        conversationalResponse: 'I analyzed your document and found it covers interesting topics. While I couldn\'t enhance it with real-time information, the core content provides valuable insights.',
        keyConnections: [],
        learningPath: [],
        actionableInsights: [],
        furtherExploration: basicAnalysis.keyTopics || [],
        confidenceScore: 0.3
      };
    }
  }

  /**
   * Chat with enhanced document context (RAG + real-time + video)
   * @param {string} question - User question
   * @param {Array} documentChunks - Relevant document chunks
   * @param {Object} enhancedContext - Enhanced context from RAG processing
   * @param {Array} chatHistory - Previous conversation
   * @returns {Promise<Object>} - Chat response with sources
   */
  async chatWithEnhancedContext(question, documentChunks = [], enhancedContext = {}, chatHistory = []) {
    try {
      const documentContext = documentChunks
        .map(chunk => chunk.text || chunk.content)
        .join('\n\n');

      const searchContext = enhancedContext.realTimeSearch?.results
        ?.map(result => `${result.title}: ${result.content}`)
        .join('\n\n') || '';

      const videoContext = enhancedContext.videoSuggestions?.videos
        ?.map(video => `Video: ${video.title} - ${video.description}`)
        .join('\n\n') || '';

      const conversationHistory = chatHistory
        .slice(-10)
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      // Create context-aware prompt based on available information
      let contextualPrompt;
      
      if (!documentContext && !searchContext && !videoContext) {
        // No additional context available - general AI assistant mode
        contextualPrompt = `
You are a helpful AI assistant. The user is asking a question but hasn't uploaded any documents yet. 

USER QUESTION: ${question}

Provide a helpful, informative response. If appropriate, suggest that the user can:
- Upload documents to get more specific, document-based answers
- Ask more specific questions about topics you can help with
- Use the enhanced features like real-time web search and video suggestions

Keep your response friendly, conversational, and helpful.
        `;
      } else {
        // Context available - enhanced RAG mode
        contextualPrompt = `
You are a helpful AI assistant responding to questions about documents, with access to real-time information and video resources.

DOCUMENT CONTENT:
${documentContext}

REAL-TIME SEARCH RESULTS:
${searchContext}

RELATED VIDEOS:
${videoContext}

CONVERSATION HISTORY:
${conversationHistory}

USER QUESTION: ${question}

Provide a comprehensive, helpful response that:
1. Draws from the document content when relevant
2. Incorporates current information from search results
3. Suggests relevant videos when appropriate
4. Maintains a natural, conversational tone
5. Cites sources when making specific claims

If you reference search results or videos, mention them naturally in your response.
        `;
      }

      const response = await groqService.generateText(contextualPrompt, {
        maxTokens: 1024,
        temperature: 0.7
      });

      // Extract mentioned sources
      const mentionedSources = [];
      
      if (enhancedContext.realTimeSearch?.results) {
        enhancedContext.realTimeSearch.results.forEach(result => {
          if (response.toLowerCase().includes(result.title.toLowerCase().substring(0, 20))) {
            mentionedSources.push({
              type: 'web',
              title: result.title,
              url: result.url,
              relevance: 'mentioned'
            });
          }
        });
      }

      if (enhancedContext.videoSuggestions?.videos) {
        enhancedContext.videoSuggestions.videos.forEach(video => {
          if (response.toLowerCase().includes(video.title.toLowerCase().substring(0, 20))) {
            mentionedSources.push({
              type: 'video',
              title: video.title,
              url: video.url,
              relevance: 'mentioned'
            });
          }
        });
      }

      return {
        response,
        sources: mentionedSources,
        hasEnhancedContext: !!(searchContext || videoContext),
        contextTypes: {
          documents: documentChunks.length > 0,
          realTimeSearch: !!searchContext,
          videos: !!videoContext
        }
      };

    } catch (error) {
      console.error('Enhanced chat error:', error);
      // Fallback to basic chat
      return {
        response: await groqService.chatWithDocuments(question, documentChunks, chatHistory),
        sources: [],
        hasEnhancedContext: false,
        contextTypes: {
          documents: documentChunks.length > 0,
          realTimeSearch: false,
          videos: false
        }
      };
    }
  }
}

export default new RAGService();