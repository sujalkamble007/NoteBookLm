import { Router } from 'express';
import {
  uploadDocuments,
  queryDocuments,
  getUserDocuments,
  getDocumentDetails,
  deleteDocument,
  testVectorSearch
} from '../controllers/document.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { 
  uploadMultiple, 
  handleUploadErrors, 
  validateFileMetadata 
} from '../middleware/upload.middleware.js';

const router = Router();

// Apply authentication to all routes
router.use(protect);

// Document upload and processing
router.post('/upload', 
  uploadMultiple,
  handleUploadErrors,
  validateFileMetadata,
  uploadDocuments
);

// Document querying (Q&A)
router.post('/query', queryDocuments);

// Document management
router.get('/', getUserDocuments);
router.get('/:documentId', getDocumentDetails);
router.delete('/:documentId', deleteDocument);

// Testing and utilities
router.get('/test/vector-search', testVectorSearch);

export default router;