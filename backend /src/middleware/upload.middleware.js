import multer from 'multer';
import path from 'path';
import { ApiError } from '../utils/ApiError.js';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Files will be stored in uploads directory
    cb(null, './public/uploads/documents');
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter to check file types
const fileFilter = (req, file, cb) => {
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

  const allowedExtensions = ['.pdf', '.docx', '.doc', '.csv', '.txt', '.xls', '.xlsx'];
  
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Invalid file type. Only PDF, DOCX, CSV, TXT, and Excel files are allowed'), false);
  }
};

// Multer configuration
export const uploadDocument = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 5 // Maximum 5 files at once
  }
});

// Error handling middleware for multer
export const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(400, 'File size too large. Maximum size is 50MB'));
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