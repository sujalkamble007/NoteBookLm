import mongoose from 'mongoose';

const documentChunkSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  embedding: {
    type: [Number],
    required: true,
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length === 384; // MiniLM-L6-v2 dimensions
      },
      message: 'Embedding must be an array of 384 numbers'
    }
  },
  chunkIndex: {
    type: Number,
    required: true,
    min: 0
  },
  startPosition: {
    type: Number,
    default: 0
  },
  endPosition: {
    type: Number,
    default: 0
  }
});

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  originalFilename: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true,
    enum: ['pdf', 'docx', 'txt', 'csv', 'xlsx', 'xls']
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    default: ''
  },
  keyInsights: [{
    type: String
  }],
  suggestedQuestions: [{
    type: String
  }],
  chunks: [documentChunkSchema],
  metadata: {
    wordCount: {
      type: Number,
      default: 0
    },
    characterCount: {
      type: Number,
      default: 0
    },
    chunkCount: {
      type: Number,
      default: 0
    },
    language: {
      type: String,
      default: 'en'
    },
    processingTime: {
      type: Number, // milliseconds
      default: 0
    }
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notebook: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notebook',
    default: null
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  processingError: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
documentSchema.index({ owner: 1, createdAt: -1 });
documentSchema.index({ notebook: 1, createdAt: -1 });
documentSchema.index({ title: 'text', content: 'text' });
documentSchema.index({ tags: 1 });
documentSchema.index({ isPublic: 1, status: 1 });

// Virtual for document URL (if needed)
documentSchema.virtual('url').get(function() {
  return `/api/v1/documents/${this._id}`;
});

// Pre-save middleware to update metadata
documentSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    this.metadata.wordCount = this.content.split(/\s+/).length;
    this.metadata.characterCount = this.content.length;
    this.metadata.chunkCount = this.chunks.length;
  }
  next();
});

// Instance methods
documentSchema.methods.addChunk = function(text, embedding, chunkIndex, startPos = 0, endPos = 0) {
  this.chunks.push({
    text,
    embedding,
    chunkIndex,
    startPosition: startPos,
    endPosition: endPos
  });
};

documentSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  // Remove large embedding arrays for lightweight responses
  if (obj.chunks) {
    obj.chunks = obj.chunks.map(chunk => ({
      text: chunk.text,
      chunkIndex: chunk.chunkIndex,
      startPosition: chunk.startPosition,
      endPosition: chunk.endPosition,
      // Remove embedding array
    }));
  }
  return obj;
};

// Static methods
documentSchema.statics.findByOwner = function(ownerId, options = {}) {
  const { page = 1, limit = 10, status = 'completed' } = options;
  
  return this.find({ 
    owner: ownerId, 
    status: status 
  })
  .select('-content -chunks.embedding') // Exclude large fields
  .sort({ createdAt: -1 })
  .skip((page - 1) * limit)
  .limit(limit)
  .populate('notebook', 'title description');
};

documentSchema.statics.searchByText = function(query, ownerId, options = {}) {
  const { page = 1, limit = 10 } = options;
  
  return this.find({
    owner: ownerId,
    status: 'completed',
    $text: { $search: query }
  }, {
    score: { $meta: 'textScore' }
  })
  .select('-content -chunks.embedding')
  .sort({ score: { $meta: 'textScore' } })
  .skip((page - 1) * limit)
  .limit(limit);
};

// Export the model
export default mongoose.model('Document', documentSchema);