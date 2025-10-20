import { Router } from 'express';
import {
  chatWithDocuments,
  getDocumentInsights,
  generateStudyMaterials
} from '../controllers/chat.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// Apply auth middleware to all routes
router.use(protect);

// Add logging middleware to see if requests reach the route
router.use((req, res, next) => {
  console.log('📋 Chat route middleware hit:', req.method, req.path);
  console.log('📝 Request body:', req.body);
  next();
});

// Chat with documents using RAG
router.route('/documents').post(chatWithDocuments);

// Test endpoint
router.route('/test').post((req, res) => {
  console.log('🧪 Test endpoint hit!');
  res.json({ message: "Test successful!", body: req.body });
});

// Simple chat test with direct Groq call
router.route('/simple').post(async (req, res) => {
  try {
    console.log('🤖 Simple chat test endpoint hit');
    const { question } = req.body;
    
    // Import Groq service
    const groqService = (await import('../utils/groq.service.js')).default;
    
    // Make direct Groq call
    const prompt = `You are a helpful AI assistant. Answer the user's question in a friendly and helpful manner.
    
User Question: ${question || "Hello, how can you help me?"}`;
    
    const response = await groqService.generateText(prompt);
    
    console.log('✅ Groq response received');
    res.json({
      success: true,
      data: {
        response: response,
        message: "Direct Groq test successful"
      }
    });
    
  } catch (error) {
    console.error('❌ Simple chat test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// Get document insights
router.route('/insights/:documentId').get(getDocumentInsights);

// Generate study materials
router.route('/study/:documentId').post(generateStudyMaterials);

export default router;