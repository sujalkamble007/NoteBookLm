import axios from 'axios';

class GroqService {
  constructor() {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is required');
    }
    
    this.apiKey = process.env.GROQ_API_KEY;
    this.baseURL = 'https://api.groq.com/openai/v1';
    this.defaultModel = 'llama-3.1-70b-versatile';
    
    // Create axios instance with default config
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });
  }

  /**
   * Generate answer based on context and question
   * @param {string} question - User question
   * @param {string} context - Retrieved document context
   * @param {string} model - Model to use (optional)
   * @returns {Promise<string>} - Generated answer
   */
  async generateAnswer(question, context, model = this.defaultModel) {
    try {
      const systemPrompt = `You are a helpful AI assistant that answers questions based on the provided document context. 

Guidelines:
- Use ONLY the information provided in the context to answer questions
- If the context doesn't contain relevant information, clearly state that
- Provide specific and detailed answers when possible
- If you need to make inferences, clearly indicate that
- Format your response in a clear and readable manner
- If asked about sources, refer to "the provided documents"`;

      const userPrompt = `Context from documents:
${context}

Question: ${question}

Please answer the question based on the provided context.`;

      const response = await this.client.post('/chat/completions', {
        model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.9,
      });

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response from Groq API');
      }

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Groq API error:', error);
      
      if (error.response?.data) {
        throw new Error(`Groq API error: ${error.response.data.error?.message || 'Unknown error'}`);
      }
      
      throw new Error(`Failed to generate answer: ${error.message}`);
    }
  }

  /**
   * Generate summary of document content
   * @param {string} content - Document content
   * @param {number} maxLength - Maximum summary length
   * @returns {Promise<string>} - Generated summary
   */
  async generateSummary(content, maxLength = 500) {
    try {
      const prompt = `Please provide a concise summary of the following document content in ${maxLength} characters or less:

${content.substring(0, 3000)}${content.length > 3000 ? '...' : ''}

Summary:`;

      const response = await this.client.post('/chat/completions', {
        model: this.defaultModel,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: Math.ceil(maxLength / 3), // Rough estimation of tokens
        top_p: 0.9,
      });

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response from Groq API');
      }

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Summary generation error:', error);
      throw new Error(`Failed to generate summary: ${error.message}`);
    }
  }

  /**
   * Generate key insights from document content
   * @param {string} content - Document content
   * @returns {Promise<string[]>} - Array of key insights
   */
  async generateKeyInsights(content) {
    try {
      const prompt = `Analyze the following document content and extract 5-7 key insights or main points:

${content.substring(0, 3000)}${content.length > 3000 ? '...' : ''}

Please provide the insights as a numbered list, each point being concise and informative.`;

      const response = await this.client.post('/chat/completions', {
        model: this.defaultModel,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 500,
        top_p: 0.9,
      });

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response from Groq API');
      }

      const content_response = response.data.choices[0].message.content.trim();
      
      // Extract numbered points
      const insights = content_response
        .split('\n')
        .filter(line => line.trim().match(/^\d+\./))
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(insight => insight.length > 0);

      return insights.length > 0 ? insights : [content_response];
    } catch (error) {
      console.error('Key insights generation error:', error);
      throw new Error(`Failed to generate key insights: ${error.message}`);
    }
  }

  /**
   * Generate follow-up questions based on content
   * @param {string} content - Document content
   * @returns {Promise<string[]>} - Array of suggested questions
   */
  async generateFollowUpQuestions(content) {
    try {
      const prompt = `Based on the following document content, generate 5 relevant follow-up questions that someone might want to ask about this material:

${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}

Please provide only the questions, one per line, without numbering or bullet points.`;

      const response = await this.client.post('/chat/completions', {
        model: this.defaultModel,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300,
        top_p: 0.9,
      });

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response from Groq API');
      }

      const questions = response.data.choices[0].message.content
        .split('\n')
        .map(q => q.trim())
        .filter(q => q.length > 0 && q.includes('?'))
        .map(q => q.replace(/^[\d\-\*\•]\s*/, '').trim());

      return questions.slice(0, 5); // Return max 5 questions
    } catch (error) {
      console.error('Follow-up questions generation error:', error);
      throw new Error(`Failed to generate follow-up questions: ${error.message}`);
    }
  }
}

export default new GroqService();