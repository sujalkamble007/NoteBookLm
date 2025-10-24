import { Router } from 'express';
import {
  createNotebook,
  getUserNotebooks,
  getNotebookDetails,
  updateNotebook,
  deleteNotebook,
  addCollaborator,
  removeCollaborator,
  searchNotebooks,
  getPublicNotebooks,
  getNotebookStats
} from '../controllers/notebook.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// Apply authentication to all routes except public ones
router.use(protect);

// Notebook CRUD operations
router.post('/', createNotebook);
router.get('/', getUserNotebooks);
router.get('/public', getPublicNotebooks);
router.get('/search', searchNotebooks);
router.get('/:notebookId', getNotebookDetails);
router.patch('/:notebookId', updateNotebook);
router.delete('/:notebookId', deleteNotebook);

// Collaboration management
router.post('/:notebookId/collaborators', addCollaborator);
router.delete('/:notebookId/collaborators/:userId', removeCollaborator);

// Statistics
router.get('/:notebookId/stats', getNotebookStats);

export default router;