import Notebook from '../models/Notebook.model.js';
import Document from '../models/Document.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

/**
 * Create new notebook
 */
export const createNotebook = asyncHandler(async (req, res) => {
  const { title, description, tags, isPublic = false } = req.body;

  if (!title || title.trim().length === 0) {
    throw new ApiError(400, 'Notebook title is required');
  }

  const notebook = await Notebook.create({
    title: title.trim(),
    description: description?.trim() || '',
    owner: req.user._id,
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
    isPublic,
    settings: {
      allowCollaboration: true,
      allowPublicAccess: isPublic,
      autoGenerateInsights: true
    }
  });

  await notebook.populate('owner', 'name email');

  return res.status(201).json(
    new ApiResponse(201, notebook, 'Notebook created successfully')
  );
});

/**
 * Get user's notebooks
 */
export const getUserNotebooks = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    status = 'active', 
    includeCollaborations = true 
  } = req.query;

  const notebooks = await Notebook.findByUser(req.user._id, {
    page: parseInt(page),
    limit: parseInt(limit),
    status,
    includeCollaborations: includeCollaborations === 'true'
  });

  const total = await Notebook.countDocuments({
    status,
    $or: [
      { owner: req.user._id },
      ...(includeCollaborations === 'true' ? [{ 'collaborators.user': req.user._id }] : [])
    ]
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        notebooks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      },
      'Notebooks retrieved successfully'
    )
  );
});

/**
 * Get notebook details
 */
export const getNotebookDetails = asyncHandler(async (req, res) => {
  const { notebookId } = req.params;

  const notebook = await Notebook.findOne({ 
    _id: notebookId, 
    status: 'active' 
  })
  .populate('owner', 'name email')
  .populate('collaborators.user', 'name email')
  .populate({
    path: 'documents',
    select: 'title originalFilename fileType status summary keyInsights createdAt metadata',
    match: { status: 'completed' }
  });

  if (!notebook) {
    throw new ApiError(404, 'Notebook not found');
  }

  // Check access permissions
  if (!notebook.hasAccess(req.user._id, 'viewer') && !notebook.isPublic) {
    throw new ApiError(403, 'No access to this notebook');
  }

  // Increment view count for public notebooks
  if (notebook.isPublic && notebook.owner.toString() !== req.user._id.toString()) {
    notebook.statistics.viewCount += 1;
    await notebook.save();
  }

  return res.status(200).json(
    new ApiResponse(200, notebook, 'Notebook details retrieved successfully')
  );
});

/**
 * Update notebook
 */
export const updateNotebook = asyncHandler(async (req, res) => {
  const { notebookId } = req.params;
  const { title, description, tags, isPublic, settings } = req.body;

  const notebook = await Notebook.findById(notebookId);

  if (!notebook) {
    throw new ApiError(404, 'Notebook not found');
  }

  // Check if user has edit access
  if (!notebook.hasAccess(req.user._id, 'editor')) {
    throw new ApiError(403, 'No edit access to this notebook');
  }

  // Update fields
  if (title !== undefined) notebook.title = title.trim();
  if (description !== undefined) notebook.description = description.trim();
  if (tags !== undefined) {
    notebook.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
  }
  if (isPublic !== undefined) notebook.isPublic = isPublic;
  if (settings !== undefined) {
    notebook.settings = { ...notebook.settings, ...settings };
  }

  await notebook.save();
  await notebook.populate('owner', 'name email');

  return res.status(200).json(
    new ApiResponse(200, notebook, 'Notebook updated successfully')
  );
});

/**
 * Delete notebook
 */
export const deleteNotebook = asyncHandler(async (req, res) => {
  const { notebookId } = req.params;

  const notebook = await Notebook.findById(notebookId);

  if (!notebook) {
    throw new ApiError(404, 'Notebook not found');
  }

  // Only owner can delete notebook
  if (notebook.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Only notebook owner can delete the notebook');
  }

  // Soft delete - update status instead of removing
  notebook.status = 'deleted';
  await notebook.save();

  // Optionally, also update associated documents
  await Document.updateMany(
    { notebook: notebookId },
    { notebook: null }
  );

  return res.status(200).json(
    new ApiResponse(200, { deletedId: notebook._id }, 'Notebook deleted successfully')
  );
});

/**
 * Add collaborator to notebook
 */
export const addCollaborator = asyncHandler(async (req, res) => {
  const { notebookId } = req.params;
  const { userId, role = 'viewer' } = req.body;

  if (!userId) {
    throw new ApiError(400, 'User ID is required');
  }

  const validRoles = ['viewer', 'editor', 'admin'];
  if (!validRoles.includes(role)) {
    throw new ApiError(400, 'Invalid role. Must be viewer, editor, or admin');
  }

  const notebook = await Notebook.findById(notebookId);

  if (!notebook) {
    throw new ApiError(404, 'Notebook not found');
  }

  // Check if user has admin access
  if (!notebook.hasAccess(req.user._id, 'admin')) {
    throw new ApiError(403, 'No admin access to this notebook');
  }

  // Check if user exists (you might want to validate against User model)
  // For now, we'll assume the userId is valid

  await notebook.addCollaborator(userId, role, req.user._id);
  await notebook.populate('collaborators.user', 'name email');

  return res.status(200).json(
    new ApiResponse(200, notebook, 'Collaborator added successfully')
  );
});

/**
 * Remove collaborator from notebook
 */
export const removeCollaborator = asyncHandler(async (req, res) => {
  const { notebookId, userId } = req.params;

  const notebook = await Notebook.findById(notebookId);

  if (!notebook) {
    throw new ApiError(404, 'Notebook not found');
  }

  // Check if user has admin access
  if (!notebook.hasAccess(req.user._id, 'admin')) {
    throw new ApiError(403, 'No admin access to this notebook');
  }

  await notebook.removeCollaborator(userId);

  return res.status(200).json(
    new ApiResponse(200, { removedUserId: userId }, 'Collaborator removed successfully')
  );
});

/**
 * Search notebooks
 */
export const searchNotebooks = asyncHandler(async (req, res) => {
  const { 
    query, 
    page = 1, 
    limit = 10, 
    publicOnly = false 
  } = req.query;

  if (!query || query.trim().length === 0) {
    throw new ApiError(400, 'Search query is required');
  }

  const userId = publicOnly === 'true' ? null : req.user._id;

  const notebooks = await Notebook.searchByText(query, userId, {
    page: parseInt(page),
    limit: parseInt(limit)
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        notebooks,
        query,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      },
      'Search completed successfully'
    )
  );
});

/**
 * Get public notebooks
 */
export const getPublicNotebooks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const notebooks = await Notebook.findPublic({
    page: parseInt(page),
    limit: parseInt(limit)
  });

  const total = await Notebook.countDocuments({
    isPublic: true,
    status: 'active'
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        notebooks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      },
      'Public notebooks retrieved successfully'
    )
  );
});

/**
 * Get notebook statistics
 */
export const getNotebookStats = asyncHandler(async (req, res) => {
  const { notebookId } = req.params;

  const notebook = await Notebook.findById(notebookId);

  if (!notebook) {
    throw new ApiError(404, 'Notebook not found');
  }

  // Check access permissions
  if (!notebook.hasAccess(req.user._id, 'viewer') && !notebook.isPublic) {
    throw new ApiError(403, 'No access to this notebook');
  }

  // Get document statistics
  const documentStats = await Document.aggregate([
    {
      $match: {
        notebook: notebook._id,
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalDocuments: { $sum: 1 },
        totalFileSize: { $sum: '$fileSize' },
        totalWordCount: { $sum: '$metadata.wordCount' },
        avgProcessingTime: { $avg: '$metadata.processingTime' },
        fileTypes: { 
          $push: '$fileType'
        }
      }
    }
  ]);

  const stats = documentStats[0] || {
    totalDocuments: 0,
    totalFileSize: 0,
    totalWordCount: 0,
    avgProcessingTime: 0,
    fileTypes: []
  };

  // Count file types
  const fileTypeCounts = stats.fileTypes.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const notebookStats = {
    notebook: {
      id: notebook._id,
      title: notebook.title,
      createdAt: notebook.createdAt,
      lastActivity: notebook.statistics.lastActivity,
      viewCount: notebook.statistics.viewCount
    },
    documents: {
      total: stats.totalDocuments,
      totalSizeMB: Math.round(stats.totalFileSize / (1024 * 1024) * 100) / 100,
      totalWords: stats.totalWordCount,
      avgProcessingTimeMs: Math.round(stats.avgProcessingTime),
      fileTypes: fileTypeCounts
    },
    collaborators: {
      total: notebook.collaborators.length,
      roles: notebook.collaborators.reduce((acc, collab) => {
        acc[collab.role] = (acc[collab.role] || 0) + 1;
        return acc;
      }, {})
    }
  };

  return res.status(200).json(
    new ApiResponse(200, notebookStats, 'Notebook statistics retrieved successfully')
  );
});