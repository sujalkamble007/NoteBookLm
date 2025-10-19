import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const notebookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Notebook title is required'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Collaboration features
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'viewer'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Content organization
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  category: {
    type: String,
    enum: ['research', 'education', 'business', 'personal', 'other'],
    default: 'personal'
  },
  // Privacy settings
  isPublic: {
    type: Boolean,
    default: false
  },
  shareLink: {
    type: String,
    unique: true,
    sparse: true
  },
  // AI features metadata
  aiSummary: {
    type: String,
    maxlength: 2000
  },
  keyTopics: [{
    topic: String,
    confidence: Number, // 0-1 scale
    sources: [String] // Document IDs that mention this topic
  }],
  // Mindmap data
  mindmapData: {
    nodes: [{
      id: String,
      label: String,
      type: {
        type: String,
        enum: ['concept', 'document', 'topic', 'connection']
      },
      x: Number,
      y: Number,
      metadata: mongoose.Schema.Types.Mixed
    }],
    edges: [{
      id: String,
      source: String,
      target: String,
      label: String,
      strength: Number // Connection strength 0-1
    }]
  },
  // Podcast generation
  podcastGenerated: {
    type: Boolean,
    default: false
  },
  podcastScript: {
    type: String
  },
  podcastAudioUrl: {
    type: String
  },
  podcastDuration: {
    type: Number // in seconds
  },
  // Analytics
  viewCount: {
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
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },
  // Processing status for AI features
  processingStatus: {
    summary: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    mindmap: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    podcast: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for documents in this notebook
notebookSchema.virtual('documents', {
  ref: 'Document',
  localField: '_id',
  foreignField: 'notebook'
});

// Virtual for chat conversations
notebookSchema.virtual('chats', {
  ref: 'Chat',
  localField: '_id',
  foreignField: 'notebook'
});

// Virtual for document count
notebookSchema.virtual('documentCount', {
  ref: 'Document',
  localField: '_id',
  foreignField: 'notebook',
  count: true
});

// Indexes for better performance
notebookSchema.index({ owner: 1, createdAt: -1 });
notebookSchema.index({ tags: 1 });
notebookSchema.index({ category: 1 });
notebookSchema.index({ shareLink: 1 });
notebookSchema.index({ 'keyTopics.topic': 'text', title: 'text', description: 'text' });

// Pre-save middleware to generate share link if public
notebookSchema.pre('save', function(next) {
  if (this.isPublic && !this.shareLink) {
    this.shareLink = mongoose.Types.ObjectId().toString();
  }
  next();
});

// Method to check if user has access
notebookSchema.methods.hasAccess = function(userId, requiredRole = 'viewer') {
  // Owner has full access
  if (this.owner.toString() === userId.toString()) {
    return true;
  }
  
  // Check collaborators
  const collaborator = this.collaborators.find(
    collab => collab.user.toString() === userId.toString()
  );
  
  if (!collaborator) return false;
  
  const roleHierarchy = { viewer: 1, editor: 2, admin: 3 };
  return roleHierarchy[collaborator.role] >= roleHierarchy[requiredRole];
};

// Method to add collaborator
notebookSchema.methods.addCollaborator = function(userId, role = 'viewer') {
  const existingCollab = this.collaborators.find(
    collab => collab.user.toString() === userId.toString()
  );
  
  if (existingCollab) {
    existingCollab.role = role;
  } else {
    this.collaborators.push({ user: userId, role });
  }
};

// Static method to find accessible notebooks for user
notebookSchema.statics.findAccessible = function(userId) {
  return this.find({
    $or: [
      { owner: userId },
      { 'collaborators.user': userId },
      { isPublic: true }
    ],
    status: 'active'
  }).populate('owner', 'name email avatar')
    .populate('collaborators.user', 'name email avatar');
};

// Add pagination plugin
notebookSchema.plugin(mongoosePaginate);

export default mongoose.model('Notebook', notebookSchema);