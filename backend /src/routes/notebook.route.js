import { Router } from 'express';
import {
  createNotebook,
  getNotebooks,
  getNotebook,
  updateNotebook,
  deleteNotebook,
  addCollaborator,
  removeCollaborator,
  getPublicNotebooks,
  generateNotebookSummary,
  generateMindmap,
  generatePodcast
} from '../controllers/notebook.controller.js';
import { protect, checkSubscription } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.route('/public').get(getPublicNotebooks);

// All other routes require authentication
router.use(protect);

// Basic CRUD operations
router.route('/').post(createNotebook).get(getNotebooks);
router.route('/:id').get(getNotebook).patch(updateNotebook).delete(deleteNotebook);

// Collaboration
router.route('/:id/collaborators').post(addCollaborator);
router.route('/:id/collaborators/:collaboratorId').delete(removeCollaborator);

// AI Features (some may require premium subscription)
router.route('/:id/summary').post(generateNotebookSummary);
router.route('/:id/mindmap').post(checkSubscription('premium'), generateMindmap);
router.route('/:id/podcast').post(checkSubscription('premium'), generatePodcast);

export default router;