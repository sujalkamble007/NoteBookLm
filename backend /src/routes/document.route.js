import { Router } from 'express';
import {
  uploadDocument,
  processDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  getDocumentsByNotebook,
  generateDocumentEmbeddings,
  searchDocuments,
  getProcessingStatus
} from '../controllers/document.controller.js';
import { protect as verifyJWT } from '../middleware/auth.middleware.js';
import { 
  uploadDocument as cloudinaryUpload, 
  validateNotebookAccess, 
  handleMulterError 
} from '../middleware/cloudinary.middleware.js';

const router = Router();

// Apply JWT verification to all routes
router.use(verifyJWT);

// Upload and process document
router.route('/upload')
  .post(
    validateNotebookAccess,
    cloudinaryUpload.array('documents', 5),
    handleMulterError,
    uploadDocument
  );

// Process uploaded document (extract content, generate embeddings)
router.route('/process/:documentId')
  .post(processDocument);

// Get, update, delete specific document
router.route('/:documentId')
  .get(getDocument)
  .put(updateDocument)
  .delete(deleteDocument);

// Generate embeddings for document
router.route('/:documentId/embeddings')
  .post(generateDocumentEmbeddings);

// Get all documents in a notebook
router.route('/notebook/:notebookId')
  .get(getDocumentsByNotebook);

// Search documents
router.route('/search')
  .post(searchDocuments);

// Get processing status
router.route('/:documentId/status')
  .get(getProcessingStatus);

export default router;