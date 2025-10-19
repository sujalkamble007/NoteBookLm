import Groq from 'groq-sdk';
import { ApiError } from './ApiError.js';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

class GroqService {
  constructor() {
    this.models = {
      fast: 'mixtral-8x7b-32768',
      balanced: 'llama2-70b-4096',
      powerful: 'mixtral-8x7b-32768'
    };
  }

  /**
   * Generate text completion using Groq
   * @param {string} prompt - The input prompt
   * @param {Object} options - Generation options
   * @returns {Promise<string>} - Generated text
   */
  async generateText(prompt, options = {}) {
    try {
      const {
        model = this.models.fast,
        maxTokens = 1024,
        temperature = 0.7,
        topP = 1,
        stream = false
      } = options;

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        model,
        max_tokens: maxTokens,
        temperature,
        top_p: topP,
        stream
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Groq API Error:', error);
      throw new ApiError(500, 'Failed to generate text with Groq API');
    }
  }

  /**
   * Generate streaming text completion
   * @param {string} prompt - The input prompt
   * @param {Object} options - Generation options
   * @returns {AsyncIterable} - Streaming response
   */
  async *generateTextStream(prompt, options = {}) {
    try {
      const {
        model = this.models.fast,
        maxTokens = 1024,
        temperature = 0.7,
        topP = 1
      } = options;

      const stream = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        model,
        max_tokens: maxTokens,
        temperature,
        top_p: topP,
        stream: true
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      console.error('Groq Streaming Error:', error);
      throw new ApiError(500, 'Failed to generate streaming text with Groq API');
    }
  }

  /**
   * Analyze document content and extract insights
   * @param {string} content - Document content
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} - Analysis results
   */
  async analyzeDocument(content, options = {}) {
    try {
      const { type = 'general', language = 'english' } = options;

      const prompt = `
Analyze the following document and provide insights:

Document Content:
${content}

Please provide:
1. A concise summary (max 200 words)
2. Key topics and themes
3. Important entities (people, places, organizations, dates)
4. Main concepts and ideas
5. Potential questions that could be asked about this content
6. Document type classification
7. Language and tone analysis

Format your response as a JSON object with the following structure:
{
  "summary": "...",
  "keyTopics": ["topic1", "topic2", ...],
  "entities": {
    "people": ["person1", "person2", ...],
    "places": ["place1", "place2", ...],
    "organizations": ["org1", "org2", ...],
    "dates": ["date1", "date2", ...]
  },
  "mainConcepts": ["concept1", "concept2", ...],
  "suggestedQuestions": ["question1", "question2", ...],
  "documentType": "...",
  "languageAnalysis": {
    "language": "...",
    "tone": "...",
    "complexity": "..."
  }
}
      `;

      const response = await this.generateText(prompt, {
        model: this.models.balanced,
        maxTokens: 2048,
        temperature: 0.3
      });

      try {
        return JSON.parse(response);
      } catch (parseError) {
        // If JSON parsing fails, return a basic structure
        return {
          summary: response.substring(0, 200),
          keyTopics: [],
          entities: { people: [], places: [], organizations: [], dates: [] },
          mainConcepts: [],
          suggestedQuestions: [],
          documentType: type,
          languageAnalysis: { language, tone: 'neutral', complexity: 'medium' }
        };
      }
    } catch (error) {
      console.error('Document analysis error:', error);
      throw new ApiError(500, 'Failed to analyze document');
    }
  }

  /**
   * Generate embeddings-like similarity scoring for RAG
   * Note: Groq doesn't have embeddings API, so we use text similarity
   * @param {string} query - Query text
   * @param {Array} documents - Array of document objects with content
   * @returns {Promise<Array>} - Ranked documents by relevance
   */
  async rankDocuments(query, documents) {
    try {
      const prompt = `
Given the query: "${query}"

Rank the following documents by relevance (1-10 scale, 10 being most relevant):

${documents.map((doc, index) => `
Document ${index + 1}:
Title: ${doc.title || 'Untitled'}
Content preview: ${doc.content.substring(0, 500)}...
`).join('\n')}

Respond with only a JSON array of objects with this format:
[
  {"index": 0, "score": 8.5, "reason": "brief explanation"},
  {"index": 1, "score": 6.2, "reason": "brief explanation"},
  ...
]

Sort by score descending.
      `;

      const response = await this.generateText(prompt, {
        model: this.models.fast,
        maxTokens: 1024,
        temperature: 0.2
      });

      try {
        const rankings = JSON.parse(response);
        return rankings
          .sort((a, b) => b.score - a.score)
          .map(rank => ({
            ...documents[rank.index],
            relevanceScore: rank.score,
            relevanceReason: rank.reason
          }));
      } catch (parseError) {
        // Fallback: return documents in original order
        return documents.map(doc => ({
          ...doc,
          relevanceScore: 5.0,
          relevanceReason: 'Unable to calculate relevance'
        }));
      }
    } catch (error) {
      console.error('Document ranking error:', error);
      // Return documents in original order as fallback
      return documents.map(doc => ({
        ...doc,
        relevanceScore: 5.0,
        relevanceReason: 'Ranking failed'
      }));
    }
  }

  /**
   * Generate mindmap structure from content
   * @param {string} content - Content to create mindmap from
   * @returns {Promise<Object>} - Mindmap structure
   */
  async generateMindmap(content) {
    try {
      const prompt = `
Create a hierarchical mindmap structure from the following content:

${content}

Generate a mindmap with a central topic and branching subtopics. Format as JSON:
{
  "central": "Main Topic",
  "branches": [
    {
      "name": "Branch 1",
      "children": [
        {"name": "Sub-branch 1.1", "children": []},
        {"name": "Sub-branch 1.2", "children": []}
      ]
    },
    {
      "name": "Branch 2",
      "children": [
        {"name": "Sub-branch 2.1", "children": []}
      ]
    }
  ]
}

Keep it concise but comprehensive. Max 5 main branches, max 3 levels deep.
      `;

      const response = await this.generateText(prompt, {
        model: this.models.balanced,
        maxTokens: 1024,
        temperature: 0.5
      });

      try {
        return JSON.parse(response);
      } catch (parseError) {
        // Fallback mindmap structure
        return {
          central: "Document Content",
          branches: [
            {
              name: "Main Topics",
              children: [
                { name: "Topic analysis needed", children: [] }
              ]
            }
          ]
        };
      }
    } catch (error) {
      console.error('Mindmap generation error:', error);
      throw new ApiError(500, 'Failed to generate mindmap');
    }
  }

  /**
   * Generate podcast script from content
   * @param {string} content - Content to create podcast from
   * @param {Object} options - Podcast options
   * @returns {Promise<Object>} - Podcast script
   */
  async generatePodcast(content, options = {}) {
    try {
      const { 
        duration = 'medium', 
        style = 'conversational', 
        hosts = 2 
      } = options;

      const prompt = `
Create an engaging podcast script based on the following content:

${content}

Requirements:
- ${hosts} host(s) having a ${style} discussion
- Duration: ${duration} (short=5min, medium=10min, long=20min)
- Make it engaging and informative
- Include natural dialogue, questions, and insights
- Add speaking cues like [pause], [emphasis], etc.

Format as JSON:
{
  "title": "Podcast Episode Title",
  "description": "Brief description",
  "duration": "estimated duration",
  "segments": [
    {
      "speaker": "Host1",
      "text": "What they say...",
      "cues": ["emphasis", "pause"]
    },
    {
      "speaker": "Host2", 
      "text": "Response...",
      "cues": []
    }
  ]
}
      `;

      const response = await this.generateText(prompt, {
        model: this.models.balanced,
        maxTokens: 2048,
        temperature: 0.7
      });

      try {
        return JSON.parse(response);
      } catch (parseError) {
        // Fallback podcast structure
        return {
          title: "AI-Generated Podcast",
          description: "Discussion about the provided content",
          duration: "10 minutes",
          segments: [
            {
              speaker: "Host1",
              text: "Welcome to our discussion about this interesting content.",
              cues: ["emphasis"]
            },
            {
              speaker: "Host2",
              text: "Thanks for having me. This content covers some fascinating topics.",
              cues: []
            }
          ]
        };
      }
    } catch (error) {
      console.error('Podcast generation error:', error);
      throw new ApiError(500, 'Failed to generate podcast script');
    }
  }

  /**
   * Chat with documents using RAG-like approach
   * @param {string} question - User question
   * @param {Array} relevantDocuments - Relevant document chunks
   * @param {Array} chatHistory - Previous chat messages
   * @returns {Promise<string>} - AI response
   */
  async chatWithDocuments(question, relevantDocuments = [], chatHistory = []) {
    try {
      const context = relevantDocuments
        .map(doc => `Document: ${doc.title}\nContent: ${doc.content}`)
        .join('\n\n');

      const conversationHistory = chatHistory
        .slice(-10) // Keep last 10 messages for context
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      const prompt = `
Context from documents:
${context}

Previous conversation:
${conversationHistory}

User question: ${question}

Please answer the question based on the provided document context. If the information isn't available in the documents, say so clearly. Be helpful and accurate.
      `;

      return await this.generateText(prompt, {
        model: this.models.balanced,
        maxTokens: 1024,
        temperature: 0.6
      });
    } catch (error) {
      console.error('Chat error:', error);
      throw new ApiError(500, 'Failed to generate chat response');
    }
  }
}

// Export singleton instance
export default new GroqService();