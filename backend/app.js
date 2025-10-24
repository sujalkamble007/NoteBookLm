import express, { urlencoded } from 'express';
import 'dotenv/config';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { Limit } from './constants.js';

// Import Passport configuration
import passport from './src/config/passport.config.js';

// Import routes
import authRoutes from './src/routes/auth.route.js';
import documentRoutes from './src/routes/document.route.js';
import notebookRoutes from './src/routes/notebook.route.js';

// Import error handling
import { ApiError } from './src/utils/ApiError.js';
import { ApiResponse } from './src/utils/ApiResponse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS configuration
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174', 
        'http://localhost:5175',
        'http://localhost:3000',
        process.env.CORS_ORIGIN
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: Limit }));
app.use(urlencoded({ extended: true, limit: Limit }));

// Static files and cookies
app.use(express.static("public"));
app.use(cookieParser());

// Initialize Passport
app.use(passport.initialize());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  console.log('🔍 Origin:', req.headers.origin);
  console.log('📝 Body keys:', Object.keys(req.body || {}));
  next();
});



// Basic health check route
app.get('/health', (req, res) => {
    res.status(200).json({ 
        message: 'NotebookLM Clone API is running!', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// API Routes with v1 versioning
// API Routes
app.use('/api/v1/users', authRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/notebooks', notebookRoutes);

// 404 handler for unknown routes
app.use((req, res, next) => {
    const error = new ApiError(404, `Route ${req.originalUrl} not found`);
    next(error);
});

// Global error handling middleware
app.use((error, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong" } = error;

    // Handle specific error types
    if (error.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(error.errors).map(err => err.message).join(', ');
    } else if (error.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
    } else if (error.code === 11000) {
        statusCode = 409;
        const field = Object.keys(error.keyValue)[0];
        message = `${field} already exists`;
    }

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
        console.error('Error Stack:', error.stack);
    }

    // Send error response
    res.status(statusCode).json(
        new ApiResponse(
            statusCode,
            null,
            message,
            process.env.NODE_ENV === 'development' ? error.stack : undefined
        )
    );
});

export { app };
