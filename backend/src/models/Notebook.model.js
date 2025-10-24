import mongoose from 'mongoose';

const collaboratorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['viewer', 'editor', 'admin'],
    default: 'viewer'
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const notebookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200
  },
  description: {
    type: String,
    trim: true,
    maxLength: 1000,
    default: ''
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collaborators: [collaboratorSchema],
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  settings: {
    allowCollaboration: {
      type: Boolean,
      default: true
    },
    allowPublicAccess: {
      type: Boolean,
      default: false
    },
    autoGenerateInsights: {
      type: Boolean,
      default: true
    },
    embeddingModel: {
      type: String,
      default: 'sentence-transformers/all-MiniLM-L6-v2'
    }
  },
  statistics: {
    totalDocuments: {
      type: Number,
      default: 0
    },
    totalQuestions: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    },
    viewCount: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
notebookSchema.index({ owner: 1, status: 1, createdAt: -1 });
notebookSchema.index({ 'collaborators.user': 1, status: 1 });
notebookSchema.index({ title: 'text', description: 'text' });
notebookSchema.index({ tags: 1 });
notebookSchema.index({ isPublic: 1, status: 1 });

// Virtuals
notebookSchema.virtual('url').get(function() {
  return `/api/v1/notebooks/${this._id}`;
});

notebookSchema.virtual('documentCount').get(function() {
  return this.documents ? this.documents.length : 0;
});

notebookSchema.virtual('collaboratorCount').get(function() {
  return this.collaborators ? this.collaborators.length : 0;
});

// Pre-save middleware
notebookSchema.pre('save', function(next) {
  // Update statistics
  if (this.isModified('documents')) {
    this.statistics.totalDocuments = this.documents.length;
  }
  
  // Update last activity
  this.statistics.lastActivity = new Date();
  
  next();
});

// Instance methods
notebookSchema.methods.addCollaborator = function(userId, role = 'viewer', addedBy = null) {
  // Check if user is already a collaborator
  const existingCollaborator = this.collaborators.find(
    collab => collab.user.toString() === userId.toString()
  );
  
  if (existingCollaborator) {
    // Update existing collaborator role
    existingCollaborator.role = role;
  } else {
    // Add new collaborator
    this.collaborators.push({
      user: userId,
      role,
      addedBy
    });
  }
  
  return this.save();
};

notebookSchema.methods.removeCollaborator = function(userId) {
  this.collaborators = this.collaborators.filter(
    collab => collab.user.toString() !== userId.toString()
  );
  return this.save();
};

notebookSchema.methods.hasAccess = function(userId, requiredRole = 'viewer') {
  // Owner always has access
  if (this.owner.toString() === userId.toString()) {
    return true;
  }
  
  // Check collaborators
  const collaborator = this.collaborators.find(
    collab => collab.user.toString() === userId.toString()
  );
  
  if (!collaborator) {
    return false;
  }
  
  // Role hierarchy: viewer < editor < admin < owner
  const roleHierarchy = {
    viewer: 1,
    editor: 2,
    admin: 3,
    owner: 4
  };
  
  return roleHierarchy[collaborator.role] >= roleHierarchy[requiredRole];
};

notebookSchema.methods.addDocument = function(documentId) {
  if (!this.documents.includes(documentId)) {
    this.documents.push(documentId);
  }
  return this.save();
};

notebookSchema.methods.removeDocument = function(documentId) {
  this.documents = this.documents.filter(
    doc => doc.toString() !== documentId.toString()
  );
  return this.save();
};

// Static methods
notebookSchema.statics.findByUser = function(userId, options = {}) {
  const { page = 1, limit = 10, status = 'active', includeCollaborations = true } = options;
  
  let query = {
    status,
    $or: [{ owner: userId }]
  };
  
  if (includeCollaborations) {
    query.$or.push({ 'collaborators.user': userId });
  }
  
  return this.find(query)
    .sort({ 'statistics.lastActivity': -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('owner', 'name email')
    .populate('collaborators.user', 'name email')
    .populate('documents', 'title fileType status createdAt');
};

notebookSchema.statics.findPublic = function(options = {}) {
  const { page = 1, limit = 10 } = options;
  
  return this.find({ 
    isPublic: true, 
    status: 'active' 
  })
    .sort({ 'statistics.viewCount': -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('owner', 'name')
    .select('-collaborators'); // Don't expose collaborators for public notebooks
};

notebookSchema.statics.searchByText = function(query, userId = null, options = {}) {
  const { page = 1, limit = 10 } = options;
  
  let searchQuery = {
    status: 'active',
    $text: { $search: query }
  };
  
  // If userId provided, include user's notebooks and collaborations
  if (userId) {
    searchQuery.$or = [
      { owner: userId },
      { 'collaborators.user': userId },
      { isPublic: true }
    ];
  } else {
    // Public search only
    searchQuery.isPublic = true;
  }
  
  return this.find(searchQuery, {
    score: { $meta: 'textScore' }
  })
    .sort({ score: { $meta: 'textScore' } })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('owner', 'name');
};

export default mongoose.model('Notebook', notebookSchema);