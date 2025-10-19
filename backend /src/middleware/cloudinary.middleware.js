import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import { ApiError } from '../utils/ApiError.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary storage configuration for documents
const documentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'notebooklm/documents',
    allowed_formats: ['pdf', 'doc', 'docx', 'txt', 'csv', 'xlsx', 'xls'],
    resource_type: 'auto',
    public_id: (req, file) => {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      return `doc-${uniqueSuffix}`;
    },
  },
});

// Cloudinary storage configuration for user avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'notebooklm/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 200, height: 200, crop: 'fill' },
      { quality: 'auto', fetch_format: 'auto' }
    ],
    public_id: (req, file) => {
      return `avatar-${req.user._id}-${Date.now()}`;
    },
  },
});

// File filter for documents
const documentFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/csv',
    'application/csv',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Invalid file type. Only PDF, DOCX, CSV, TXT, and Excel files are allowed'), false);
  }
};

// File filter for avatars
const avatarFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed'), false);
  }
};

// Document upload configuration
export const uploadDocument = multer({
  storage: documentStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 5 // Maximum 5 files at once
  }
});

// Avatar upload configuration
export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: avatarFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for avatars
    files: 1 // Single file upload
  }
});

// Error handling middleware for multer
export const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(400, 'File size too large. Maximum size is 50MB for documents or 5MB for avatars'));
    } else if (error.code === 'LIMIT_FILE_COUNT') {
      return next(new ApiError(400, 'Too many files. Maximum 5 files allowed'));
    } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new ApiError(400, 'Unexpected file field'));
    }
  }
  next(error);
};

// Middleware to validate notebook access before upload
export const validateNotebookAccess = async (req, res, next) => {
  try {
    const { notebookId } = req.body;
    
    if (!notebookId) {
      throw new ApiError(400, 'Notebook ID is required');
    }

    // Import here to avoid circular dependency
    const Notebook = (await import('../models/Notebook.model.js')).default;
    
    const notebook = await Notebook.findById(notebookId);
    
    if (!notebook) {
      throw new ApiError(404, 'Notebook not found');
    }

    if (!notebook.hasAccess(req.user._id, 'editor')) {
      throw new ApiError(403, 'You don\'t have permission to upload files to this notebook');
    }

    req.notebook = notebook;
    next();
  } catch (error) {
    next(error);
  }
};

// Utility function to delete file from Cloudinary
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

// Utility function to get file info from Cloudinary URL
export const getCloudinaryPublicId = (cloudinaryUrl) => {
  try {
    // Extract public_id from Cloudinary URL
    const parts = cloudinaryUrl.split('/');
    const filename = parts[parts.length - 1];
    const publicId = filename.split('.')[0];
    return publicId;
  } catch (error) {
    console.error('Error extracting public ID from Cloudinary URL:', error);
    return null;
  }
};

export { cloudinary };