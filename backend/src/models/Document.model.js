import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Document title is required'],
    trim: true,
    maxlength: 200
  },
  originalName: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true,
    unique: true
  },
  fileType: {
    type: String,
    required: true,
    enum: ['pdf', 'csv', 'docx', 'txt', 'xlsx']
  },
  mimeType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  // Document belongs to notebook and user
  notebook: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notebook',
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Content extraction and processing
  extractedText: {
    type: String,
    maxlength: 50000 // Store extracted text content
  },
  extractedData: {
    type: mongoose.Schema.Types.Mixed // For structured data from CSV/Excel
  },
  // Content metadata
  wordCount: {
    type: Number,
    default: 0
  },
  pageCount: {
    type: Number,
    default: 0
  },
  language: {
    type: String,
    default: 'en'
  },
  // AI Processing results
  aiSummary: {
    type: String,
    maxlength: 2000
  },
  keyPoints: [{
    point: String,
    importance: {
      type: Number,
      min: 0,
      max: 1
    },
    pageNumber: Number,
    context: String
  }],
  entities: [{
    text: String,
    type: {
      type: String,
      enum: ['person', 'organization', 'location', 'date', 'concept', 'other']
    },
    confidence: Number,
    positions: [Number] // Character positions in text
  }],
  topics: [{
    topic: String,
    relevance: Number, // 0-1 scale
    keywords: [String]
  }],
  // Vector embeddings for RAG
  embeddings: [{
    chunkId: String,
    text: String,
    vector: [Number], // Embedding vector
    metadata: {
      pageNumber: Number,
      startChar: Number,
      endChar: Number,
      chunkIndex: Number,
      keyTopics: [String] // Key topics for this chunk
    }
  }],
  // Enhanced RAG Analysis Results
  enhancedAnalysis: {
    ragEnhanced: {
      type: Boolean,
      default: false
    },
    enhancedInsights: {
      conversationalResponse: String,
      keyConnections: [String],
      learningPath: [String],
      actionableInsights: [String],
      furtherExploration: [String],
      confidenceScore: {
        type: Number,
        min: 0,
        max: 1
      }
    },
    realTimeSearch: {
      enabled: Boolean,
      queries: [String],
      results: [{
        query: String,
        title: String,
        url: String,
        content: String,
        score: Number,
        publishedDate: Date,
        source: String
      }]
    },
    videoSuggestions: {
      enabled: Boolean,
      videos: [{
        query: String,
        videoId: String,
        title: String,
        description: String,
        channelTitle: String,
        publishedAt: Date,
        thumbnails: mongoose.Schema.Types.Mixed,
        url: String,
        embedUrl: String,
        source: String
      }]
    },
    processingTimestamp: Date
  },
  // Processing status
  processingStatus: {
    textExtraction: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    aiAnalysis: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    vectorization: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    }
  },
  processingErrors: [{
    step: String,
    error: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // Indexing for search
  searchKeywords: [{
    type: String,
    lowercase: true
  }],
  // File metadata
  checksum: String, // For duplicate detection
  downloadCount: {
    type: Number,
    default: 0
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  // Status
  status: {
    type: String,
    enum: ['active', 'processing', 'error', 'deleted'],
    default: 'processing'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
documentSchema.index({ notebook: 1, createdAt: -1 });
documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ fileType: 1 });
documentSchema.index({ checksum: 1 });
documentSchema.index({ 'topics.topic': 1 });
documentSchema.index({ 'entities.text': 1, 'entities.type': 1 });
documentSchema.index({ 
  title: 'text', 
  extractedText: 'text', 
  searchKeywords: 'text',
  'keyPoints.point': 'text'
});

// Virtual for file size in human readable format
documentSchema.virtual('fileSizeFormatted').get(function() {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Method to check if processing is complete
documentSchema.methods.isProcessingComplete = function() {
  return this.processingStatus.textExtraction === 'completed' &&
         this.processingStatus.aiAnalysis === 'completed' &&
         this.processingStatus.vectorization === 'completed';
};

// Method to add processing error
documentSchema.methods.addProcessingError = function(step, error) {
  this.processingErrors.push({
    step,
    error: typeof error === 'string' ? error : error.message,
    timestamp: new Date()
  });
};

// Static method to find documents by type
documentSchema.statics.findByType = function(fileType, notebookId) {
  const query = { fileType, status: 'active' };
  if (notebookId) query.notebook = notebookId;
  return this.find(query);
};

// Static method for text search across documents
documentSchema.statics.searchDocuments = function(query, notebookId, options = {}) {
  const searchQuery = {
    $text: { $search: query },
    status: 'active'
  };
  
  if (notebookId) {
    searchQuery.notebook = notebookId;
  }
  
  return this.find(searchQuery, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .limit(options.limit || 20);
};

// Pre-save middleware to update search keywords
documentSchema.pre('save', function(next) {
  if (this.isModified('extractedText') || this.isModified('title')) {
    // Extract keywords for search
    const text = `${this.title} ${this.extractedText || ''}`;
    const keywords = text.toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3)
      .slice(0, 100); // Limit keywords
    
    this.searchKeywords = [...new Set(keywords)];
  }
  next();
});

// Add pagination plugin
documentSchema.plugin(mongoosePaginate);

export default mongoose.model('Document', documentSchema);