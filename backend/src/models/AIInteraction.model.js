import mongoose from 'mongoose';

const aiInteractionSchema = new mongoose.Schema({
  // Basic identification
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notebook: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notebook',
    required: true
  },
  // Type of AI interaction
  interactionType: {
    type: String,
    enum: [
      'chat',
      'document_summary',
      'mindmap_generation',
      'podcast_generation',
      'tavily_search',
      'youtube_search',
      'entity_extraction',
      'topic_analysis',
      'document_qa',
      'content_synthesis'
    ],
    required: true
  },
  // Input and context
  input: {
    prompt: String,
    parameters: mongoose.Schema.Types.Mixed,
    contextDocuments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    }],
    searchQuery: String,
    filters: mongoose.Schema.Types.Mixed
  },
  // Output and results
  output: {
    response: String,
    structured_data: mongoose.Schema.Types.Mixed,
    metadata: mongoose.Schema.Types.Mixed
  },
  // AI Model and configuration used
  model: {
    provider: {
      type: String,
      enum: ['openai', 'anthropic', 'google', 'local', 'tavily', 'elevenlabs', 'youtube'],
      required: true
    },
    modelName: String,
    version: String,
    parameters: {
      temperature: Number,
      maxTokens: Number,
      topP: Number,
      frequencyPenalty: Number,
      presencePenalty: Number
    }
  },
  // Processing details
  processingTime: {
    type: Number, // in milliseconds
    default: 0
  },
  tokenUsage: {
    inputTokens: {
      type: Number,
      default: 0
    },
    outputTokens: {
      type: Number,
      default: 0
    },
    totalTokens: {
      type: Number,
      default: 0
    }
  },
  cost: {
    type: Number,
    default: 0 // Cost in USD
  },
  // Status and quality
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  quality: {
    score: {
      type: Number,
      min: 0,
      max: 1
    },
    metrics: {
      relevance: Number,
      coherence: Number,
      accuracy: Number,
      completeness: Number
    }
  },
  // User feedback
  userFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    helpful: Boolean,
    reportIssue: {
      type: String,
      enum: ['inappropriate', 'inaccurate', 'irrelevant', 'incomplete', 'other']
    },
    timestamp: Date
  },
  // Error handling
  error: {
    code: String,
    message: String,
    details: mongoose.Schema.Types.Mixed,
    retryCount: {
      type: Number,
      default: 0
    },
    lastRetryAt: Date
  },
  // Streaming and real-time features
  streaming: {
    isStreaming: {
      type: Boolean,
      default: false
    },
    streamingComplete: {
      type: Boolean,
      default: true
    },
    chunks: [{
      content: String,
      timestamp: Date,
      tokenCount: Number
    }]
  },
  // Human-in-the-loop
  humanReview: {
    required: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'modified'],
      default: 'approved'
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewNotes: String,
    reviewedAt: Date
  },
  // Related interactions (for chains/workflows)
  parentInteraction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AIInteraction'
  },
  childInteractions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AIInteraction'
  }],
  // External service data
  externalServices: {
    tavily: {
      searchId: String,
      resultsCount: Number,
      sources: [{
        url: String,
        title: String,
        snippet: String,
        score: Number
      }]
    },
    youtube: {
      searchQuery: String,
      videoResults: [{
        videoId: String,
        title: String,
        channelName: String,
        duration: String,
        viewCount: Number,
        publishedAt: Date,
        summary: String
      }]
    },
    elevenlabs: {
      voiceId: String,
      audioUrl: String,
      duration: Number,
      charactersUsed: Number
    }
  },
  // Cache and optimization
  cacheKey: String,
  cacheHit: {
    type: Boolean,
    default: false
  },
  cachedAt: Date,
  // Analytics and tracking
  sessionId: String,
  clientInfo: {
    userAgent: String,
    ip: String,
    location: {
      country: String,
      region: String,
      city: String
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
aiInteractionSchema.index({ user: 1, createdAt: -1 });
aiInteractionSchema.index({ notebook: 1, interactionType: 1 });
aiInteractionSchema.index({ status: 1, createdAt: -1 });
aiInteractionSchema.index({ 'model.provider': 1, 'model.modelName': 1 });
aiInteractionSchema.index({ cacheKey: 1 });
aiInteractionSchema.index({ sessionId: 1 });
aiInteractionSchema.index({ parentInteraction: 1 });

// Virtual for total processing cost
aiInteractionSchema.virtual('totalCost').get(function() {
  return this.cost || 0;
});

// Pre-save middleware to calculate total tokens
aiInteractionSchema.pre('save', function(next) {
  if (this.tokenUsage.inputTokens || this.tokenUsage.outputTokens) {
    this.tokenUsage.totalTokens = (this.tokenUsage.inputTokens || 0) + (this.tokenUsage.outputTokens || 0);
  }
  next();
});

// Method to mark as completed
aiInteractionSchema.methods.markCompleted = function(output, metadata = {}) {
  this.status = 'completed';
  this.output = { ...this.output, ...output };
  if (this.streaming.isStreaming) {
    this.streaming.streamingComplete = true;
  }
  return this;
};

// Method to mark as failed
aiInteractionSchema.methods.markFailed = function(error, allowRetry = true) {
  this.status = 'failed';
  this.error = {
    code: error.code || 'UNKNOWN_ERROR',
    message: error.message || 'An unknown error occurred',
    details: error.details || error,
    retryCount: this.error?.retryCount || 0,
    lastRetryAt: allowRetry ? new Date() : this.error?.lastRetryAt
  };
  
  if (allowRetry) {
    this.error.retryCount += 1;
  }
  
  return this;
};

// Method to add streaming chunk
aiInteractionSchema.methods.addStreamingChunk = function(content, tokenCount = 0) {
  if (!this.streaming.chunks) {
    this.streaming.chunks = [];
  }
  
  this.streaming.chunks.push({
    content,
    timestamp: new Date(),
    tokenCount
  });
  
  return this;
};

// Method to calculate cost based on usage
aiInteractionSchema.methods.calculateCost = function() {
  const pricing = {
    'openai': {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.001, output: 0.002 }
    },
    'anthropic': {
      'claude-3': { input: 0.015, output: 0.075 }
    },
    'elevenlabs': {
      'audio-generation': { perCharacter: 0.00003 }
    }
  };
  
  const provider = this.model.provider;
  const modelName = this.model.modelName;
  
  if (pricing[provider] && pricing[provider][modelName]) {
    const rates = pricing[provider][modelName];
    
    if (rates.input && rates.output) {
      // Token-based pricing
      const inputCost = (this.tokenUsage.inputTokens / 1000) * rates.input;
      const outputCost = (this.tokenUsage.outputTokens / 1000) * rates.output;
      this.cost = inputCost + outputCost;
    } else if (rates.perCharacter && this.externalServices.elevenlabs?.charactersUsed) {
      // Character-based pricing for audio
      this.cost = this.externalServices.elevenlabs.charactersUsed * rates.perCharacter;
    }
  }
  
  return this.cost;
};

// Static method to get usage analytics
aiInteractionSchema.statics.getUsageAnalytics = function(userId, timeframe = '7d') {
  const startDate = new Date();
  const days = parseInt(timeframe.replace('d', ''));
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$interactionType',
        count: { $sum: 1 },
        totalTokens: { $sum: '$tokenUsage.totalTokens' },
        totalCost: { $sum: '$cost' },
        avgProcessingTime: { $avg: '$processingTime' }
      }
    }
  ]);
};

// Static method to find interactions by cache key
aiInteractionSchema.statics.findByCacheKey = function(cacheKey) {
  return this.findOne({ 
    cacheKey, 
    status: 'completed',
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 24 hours cache
  });
};

export default mongoose.model('AIInteraction', aiInteractionSchema);