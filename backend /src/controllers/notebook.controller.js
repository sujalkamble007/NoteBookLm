import Notebook from '../models/Notebook.model.js';
import User from '../models/User.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// Create new notebook
export const createNotebook = asyncHandler(async (req, res) => {
  const { title, description, tags, category, isPublic, settings } = req.body;

  // Validation
  if (!title?.trim()) {
    throw new ApiError(400, "Notebook title is required");
  }

  if (title.trim().length > 200) {
    throw new ApiError(400, "Title must be less than 200 characters");
  }

  if (description && description.length > 1000) {
    throw new ApiError(400, "Description must be less than 1000 characters");
  }

  try {
    const notebook = await Notebook.create({
      title: title.trim(),
      description: description?.trim() || "",
      owner: req.user._id,
      tags: Array.isArray(tags) ? tags : [],
      category: category || 'personal',
      isPublic: Boolean(isPublic),
      settings: {
        allowDownload: settings?.allowDownload ?? true,
        allowComments: settings?.allowComments ?? true,
        theme: settings?.theme || 'light',
        language: settings?.language || 'en'
      }
    });

    // Update user's notebook count
    await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { totalNotebooks: 1 } }
    );

    const createdNotebook = await Notebook.findById(notebook._id)
      .populate('owner', 'name email avatar')
      .populate('collaborators.user', 'name email avatar');

    return res
      .status(201)
      .json(new ApiResponse(201, createdNotebook, "Notebook created successfully"));

  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, "A notebook with this title already exists for this user");
    }
    throw new ApiError(500, error.message || "Failed to create notebook");
  }
});

// Get all notebooks for user
export const getNotebooks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category, tags, search, status = 'active' } = req.query;
  
  const query = {
    $or: [
      { owner: req.user._id },
      { 'collaborators.user': req.user._id }
    ],
    status
  };

  if (category) query.category = category;
  if (tags) query.tags = { $in: tags.split(',') };
  if (search) {
    query.$text = { $search: search };
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { updatedAt: -1 },
    populate: [
      { path: 'owner', select: 'name email avatar' },
      { path: 'collaborators.user', select: 'name email avatar' }
    ]
  };

  const notebooks = await Notebook.paginate(query, options);

  return res
    .status(200)
    .json(new ApiResponse(200, notebooks, "Notebooks fetched successfully"));
});

// Get single notebook by ID
export const getNotebook = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const notebook = await Notebook.findById(id)
    .populate('owner', 'name email avatar')
    .populate('collaborators.user', 'name email avatar')
    .populate('documents')
    .populate('chats');

  if (!notebook) {
    throw new ApiError(404, "Notebook not found");
  }

  // Check access permissions
  if (!notebook.hasAccess(req.user._id)) {
    throw new ApiError(403, "You don't have access to this notebook");
  }

  // Update view count and last accessed
  notebook.viewCount += 1;
  notebook.lastAccessed = new Date();
  await notebook.save();

  return res
    .status(200)
    .json(new ApiResponse(200, notebook, "Notebook fetched successfully"));
});

// Update notebook
export const updateNotebook = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, tags, category, isPublic } = req.body;

  const notebook = await Notebook.findById(id);

  if (!notebook) {
    throw new ApiError(404, "Notebook not found");
  }

  // Check if user has edit access
  if (!notebook.hasAccess(req.user._id, 'editor')) {
    throw new ApiError(403, "You don't have permission to edit this notebook");
  }

  const updateFields = {};
  if (title !== undefined) updateFields.title = title.trim();
  if (description !== undefined) updateFields.description = description?.trim();
  if (tags !== undefined) updateFields.tags = tags;
  if (category !== undefined) updateFields.category = category;
  if (isPublic !== undefined) updateFields.isPublic = isPublic;

  const updatedNotebook = await Notebook.findByIdAndUpdate(
    id,
    { $set: updateFields },
    { new: true, runValidators: true }
  )
    .populate('owner', 'name email avatar')
    .populate('collaborators.user', 'name email avatar');

  return res
    .status(200)
    .json(new ApiResponse(200, updatedNotebook, "Notebook updated successfully"));
});

// Delete notebook
export const deleteNotebook = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { permanent = false } = req.query;

  const notebook = await Notebook.findById(id);

  if (!notebook) {
    throw new ApiError(404, "Notebook not found");
  }

  // Only owner can delete
  if (notebook.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only notebook owner can delete it");
  }

  if (permanent) {
    // Permanent deletion
    await Notebook.findByIdAndDelete(id);
    // Also delete associated documents, chats, etc.
    // TODO: Implement cascade delete
  } else {
    // Soft delete
    notebook.status = 'deleted';
    await notebook.save();
  }

  // Update user's notebook count
  await User.findByIdAndUpdate(
    req.user._id,
    { $inc: { totalNotebooks: -1 } }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, {}, permanent ? "Notebook deleted permanently" : "Notebook moved to trash"));
});

// Add collaborator to notebook
export const addCollaborator = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email, role = 'viewer' } = req.body;

  if (!email) {
    throw new ApiError(400, "Collaborator email is required");
  }

  const notebook = await Notebook.findById(id);
  if (!notebook) {
    throw new ApiError(404, "Notebook not found");
  }

  // Only owner or admin collaborators can add others
  if (!notebook.hasAccess(req.user._id, 'admin')) {
    throw new ApiError(403, "You don't have permission to add collaborators");
  }

  // Find user to add
  const collaboratorUser = await User.findOne({ email: email.toLowerCase() });
  if (!collaboratorUser) {
    throw new ApiError(404, "User with this email not found");
  }

  // Check if already a collaborator
  const existingCollab = notebook.collaborators.find(
    collab => collab.user.toString() === collaboratorUser._id.toString()
  );

  if (existingCollab) {
    // Update existing collaborator role
    existingCollab.role = role;
  } else {
    // Add new collaborator
    notebook.collaborators.push({
      user: collaboratorUser._id,
      role
    });
  }

  await notebook.save();

  const updatedNotebook = await Notebook.findById(id)
    .populate('owner', 'name email avatar')
    .populate('collaborators.user', 'name email avatar');

  return res
    .status(200)
    .json(new ApiResponse(200, updatedNotebook, "Collaborator added successfully"));
});

// Remove collaborator from notebook
export const removeCollaborator = asyncHandler(async (req, res) => {
  const { id, collaboratorId } = req.params;

  const notebook = await Notebook.findById(id);
  if (!notebook) {
    throw new ApiError(404, "Notebook not found");
  }

  // Only owner or the collaborator themselves can remove
  const isOwner = notebook.owner.toString() === req.user._id.toString();
  const isSelf = collaboratorId === req.user._id.toString();

  if (!isOwner && !isSelf) {
    throw new ApiError(403, "You don't have permission to remove this collaborator");
  }

  // Remove collaborator
  notebook.collaborators = notebook.collaborators.filter(
    collab => collab.user.toString() !== collaboratorId
  );

  await notebook.save();

  const updatedNotebook = await Notebook.findById(id)
    .populate('owner', 'name email avatar')
    .populate('collaborators.user', 'name email avatar');

  return res
    .status(200)
    .json(new ApiResponse(200, updatedNotebook, "Collaborator removed successfully"));
});

// Get public notebooks
export const getPublicNotebooks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category, tags, search } = req.query;
  
  const query = {
    isPublic: true,
    status: 'active'
  };

  if (category) query.category = category;
  if (tags) query.tags = { $in: tags.split(',') };
  if (search) {
    query.$text = { $search: search };
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { viewCount: -1, updatedAt: -1 },
    populate: [
      { path: 'owner', select: 'name avatar' }
    ]
  };

  const notebooks = await Notebook.paginate(query, options);

  return res
    .status(200)
    .json(new ApiResponse(200, notebooks, "Public notebooks fetched successfully"));
});

// Generate notebook summary using AI
export const generateNotebookSummary = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notebook = await Notebook.findById(id)
    .populate('documents', 'extractedText aiSummary keyPoints');

  if (!notebook) {
    throw new ApiError(404, "Notebook not found");
  }

  if (!notebook.hasAccess(req.user._id)) {
    throw new ApiError(403, "You don't have access to this notebook");
  }

  // TODO: Implement AI summary generation logic
  // This would involve calling OpenAI API with document content

  notebook.processingStatus.summary = 'processing';
  await notebook.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { status: 'processing' }, "Summary generation started"));
});

// Generate mindmap for notebook
export const generateMindmap = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notebook = await Notebook.findById(id)
    .populate('documents', 'extractedText keyPoints entities topics');

  if (!notebook) {
    throw new ApiError(404, "Notebook not found");
  }

  if (!notebook.hasAccess(req.user._id)) {
    throw new ApiError(403, "You don't have access to this notebook");
  }

  // TODO: Implement mindmap generation logic
  notebook.processingStatus.mindmap = 'processing';
  await notebook.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { status: 'processing' }, "Mindmap generation started"));
});

// Generate podcast for notebook
export const generatePodcast = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { style = 'conversational', duration = 'medium' } = req.body;

  const notebook = await Notebook.findById(id)
    .populate('documents', 'extractedText aiSummary keyPoints');

  if (!notebook) {
    throw new ApiError(404, "Notebook not found");
  }

  if (!notebook.hasAccess(req.user._id, 'editor')) {
    throw new ApiError(403, "You don't have permission to generate podcast for this notebook");
  }

  // TODO: Implement podcast generation logic
  notebook.processingStatus.podcast = 'processing';
  await notebook.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { status: 'processing' }, "Podcast generation started"));
});