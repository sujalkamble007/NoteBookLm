import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ApiError } from '../utils/ApiError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../public/uploads/documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, extension).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${baseName}_${uniqueSuffix}${extension}`);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
    'text/plain',
    'text/csv',
    'application/csv',
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
  ];

  const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt', '.csv', '.xls', '.xlsx'];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, `Unsupported file type: ${file.mimetype}. Allowed types: PDF, DOCX, TXT, CSV, XLSX`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB default
    files: 10 // Maximum 10 files per request
  }
});

// Error handling middleware for multer
export const handleUploadErrors = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = 'File upload error';
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = `File too large. Maximum size allowed: ${process.env.MAX_FILE_SIZE || '50MB'}`;
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files. Maximum 10 files allowed per request';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      default:
        message = error.message;
    }
    
    return res.status(400).json({
      success: false,
      message,
      error: error.code
    });
  }
  
  next(error);
};

// Cleanup uploaded files in case of processing failure
export const cleanupUploadedFiles = (files) => {
  if (!files) return;
  
  const filesToClean = Array.isArray(files) ? files : [files];
  
  filesToClean.forEach(file => {
    try {
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        console.log(`Cleaned up file: ${file.path}`);
      }
    } catch (error) {
      console.error(`Failed to cleanup file ${file.path}:`, error);
    }
  });
};

// Validate file metadata
export const validateFileMetadata = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new ApiError(400, 'No files uploaded'));
  }

  // Validate each file
  for (const file of req.files) {
    // Check file size
    if (file.size === 0) {
      cleanupUploadedFiles(req.files);
      return next(new ApiError(400, `Empty file detected: ${file.originalname}`));
    }

    // Check filename length
    if (file.originalname.length > 255) {
      cleanupUploadedFiles(req.files);
      return next(new ApiError(400, `Filename too long: ${file.originalname}`));
    }

    // Check for potentially dangerous filenames
    const dangerousPatterns = /[<>:"/\\|?*\x00-\x1f]/;
    if (dangerousPatterns.test(file.originalname)) {
      cleanupUploadedFiles(req.files);
      return next(new ApiError(400, `Invalid characters in filename: ${file.originalname}`));
    }
  }

  next();
};

// Upload middleware configurations
export const uploadSingle = upload.single('document');
export const uploadMultiple = upload.array('documents', 10);
export const uploadFields = upload.fields([
  { name: 'documents', maxCount: 10 },
  { name: 'metadata', maxCount: 1 }
]);

// Default export
export default {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  handleUploadErrors,
  cleanupUploadedFiles,
  validateFileMetadata
};