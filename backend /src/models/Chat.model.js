import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  // For streaming responses
  isStreaming: {
    type: Boolean,
    default: false
  },
  streamingComplete: {
    type: Boolean,
    default: true
  },
  // Message metadata
  tokens: {
    type: Number,
    default: 0
  },
  model: {
    type: String,
    default: 'gpt-4'
  },
  // Citations and sources
  sources: [{
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    },
    documentTitle: String,
    chunkId: String,
    relevanceScore: Number,
    pageNumber: Number,
    excerpt: String
  }],
  // Feedback and interaction
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    timestamp: Date
  },
  // Human-in-the-loop controls
  requiresApproval: {
    type: Boolean,
    default: false
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'modified'],
    default: 'approved'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalNotes: String,
  // Message actions and capabilities
  actions: [{
    type: {
      type: String,
      enum: ['search_tavily', 'search_youtube', 'generate_mindmap', 'summarize', 'extract_entities']
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed']
    },
    result: mongoose.Schema.Types.Mixed,
    executedAt: Date
  }]
}, {
  timestamps: true
});

const chatSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    maxlength: 200,
    default: 'New Chat'
  },
  notebook: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notebook',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Chat configuration
  model: {
    type: String,
    enum: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'claude-3', 'gemini-pro'],
    default: 'gpt-4'
  },
  temperature: {
    type: Number,
    min: 0,
    max: 2,
    default: 0.7
  },
  maxTokens: {
    type: Number,
    default: 2000
  },
  // System prompt and context
  systemPrompt: {
    type: String,
    maxlength: 2000,
    default: 'You are a helpful AI assistant that helps users analyze and understand their documents. Always cite your sources when referencing document content.'
  },
  contextDocuments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  // Messages in the conversation
  messages: [messageSchema],
  // Chat metadata
  totalTokensUsed: {
    type: Number,
    default: 0
  },
  totalCost: {
    type: Number,
    default: 0
  },
  // Chat features and modes
  features: {
    ragEnabled: {
      type: Boolean,
      default: true
    },
    tavilySearchEnabled: {
      type: Boolean,
      default: true
    },
    youtubeSearchEnabled: {
      type: Boolean,
      default: true
    },
    realTimeVisualization: {
      type: Boolean,
      default: true
    },
    humanInLoop: {
      type: Boolean,
      default: false
    }
  },
  // Agent execution tracking
  agentExecutions: [{
    executionId: String,
    startTime: Date,
    endTime: Date,
    status: {
      type: String,
      enum: ['running', 'completed', 'failed', 'cancelled']
    },
    steps: [{
      stepName: String,
      status: String,
      startTime: Date,
      endTime: Date,
      output: mongoose.Schema.Types.Mixed,
      error: String
    }],
    result: mongoose.Schema.Types.Mixed
  }],
  // Chat analytics
  messageCount: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  // Status and sharing
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },
  isShared: {
    type: Boolean,
    default: false
  },
  shareLink: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
chatSchema.index({ notebook: 1, user: 1, createdAt: -1 });
chatSchema.index({ user: 1, lastActivity: -1 });
chatSchema.index({ 'messages.role': 1, 'messages.createdAt': -1 });

// Virtual for latest message
chatSchema.virtual('latestMessage').get(function() {
  return this.messages[this.messages.length - 1];
});

// Pre-save middleware to update message count and last activity
chatSchema.pre('save', function(next) {
  this.messageCount = this.messages.length;
  if (this.messages.length > 0) {
    this.lastActivity = this.messages[this.messages.length - 1].createdAt || new Date();
  }
  next();
});

// Method to add message
chatSchema.methods.addMessage = function(role, content, metadata = {}) {
  const message = {
    role,
    content,
    ...metadata
  };
  this.messages.push(message);
  return this.messages[this.messages.length - 1];
};

// Method to add user message with potential approval requirement
chatSchema.methods.addUserMessage = function(content, requiresApproval = false) {
  return this.addMessage('user', content, { requiresApproval });
};

// Method to add assistant message with sources
chatSchema.methods.addAssistantMessage = function(content, sources = [], metadata = {}) {
  return this.addMessage('assistant', content, { sources, ...metadata });
};

// Method to update streaming message
chatSchema.methods.updateStreamingMessage = function(messageId, content, isComplete = false) {
  const message = this.messages.id(messageId);
  if (message) {
    message.content = content;
    message.streamingComplete = isComplete;
  }
  return message;
};

// Method to calculate total cost
chatSchema.methods.calculateTotalCost = function() {
  // Simplified cost calculation (implement based on actual pricing)
  const inputCostPer1K = 0.03; // Example: $0.03 per 1K tokens for GPT-4
  const outputCostPer1K = 0.06;
  
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  
  this.messages.forEach(msg => {
    if (msg.role === 'user') {
      totalInputTokens += msg.tokens || 0;
    } else if (msg.role === 'assistant') {
      totalOutputTokens += msg.tokens || 0;
    }
  });
  
  this.totalCost = (totalInputTokens / 1000 * inputCostPer1K) + 
                   (totalOutputTokens / 1000 * outputCostPer1K);
  
  return this.totalCost;
};

// Static method to find recent chats for user
chatSchema.statics.findRecentByUser = function(userId, limit = 10) {
  return this.find({ user: userId, status: 'active' })
    .sort({ lastActivity: -1 })
    .limit(limit)
    .populate('notebook', 'title')
    .select('title notebook lastActivity messageCount');
};

// Static method to find chats by notebook
chatSchema.statics.findByNotebook = function(notebookId) {
  return this.find({ notebook: notebookId, status: 'active' })
    .sort({ lastActivity: -1 })
    .populate('user', 'name avatar');
};

export default mongoose.model('Chat', chatSchema);