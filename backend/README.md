# NotebookLM Clone - Backend API

![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![Express](https://img.shields.io/badge/Express-5.x-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen)
![JWT](https://img.shields.io/badge/JWT-Authentication-orange)
![Cloudinary](https://img.shields.io/badge/Cloudinary-File_Storage-blue)
![Groq](https://img.shields.io/badge/Groq-AI_Processing-purple)

A powerful backend API for a NotebookLM clone that enables multi-source document processing, AI-powered analysis, collaborative notebooks, and advanced RAG (Retrieval Augmented Generation) capabilities.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Database Models](#-database-models)
- [AI Integration](#-ai-integration)
- [File Processing](#-file-processing)
- [Authentication System](#-authentication-system)
- [Collaboration Features](#-collaboration-features)
- [Error Handling](#-error-handling)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## 🚀 Features

### Core Functionality
- **Multi-format Document Processing** (PDF, DOCX, CSV, TXT, Excel)
- **AI-Powered Content Analysis** using Groq API
- **Collaborative Notebooks** with real-time sharing
- **Advanced Search** with AI-powered ranking
- **RAG Implementation** for document-based conversations
- **Mindmap Generation** from document content
- **Podcast Script Generation** with AI
- **Real-time Document Processing** pipeline

### Authentication & Security
- **JWT-based Authentication** (Access + Refresh tokens)
- **Role-based Access Control** (Owner, Admin, Editor, Viewer)
- **OAuth Integration Ready** (Google OAuth prepared)
- **Secure File Upload** with validation and sanitization
- **Rate Limiting** and request throttling

### AI & ML Features
- **Document Text Extraction** from multiple formats
- **Entity Recognition** (People, Organizations, Locations, Dates)
- **Topic Analysis** and keyword extraction
- **Content Summarization** with AI
- **Vector Embeddings** for similarity search
- **Intelligent Document Ranking** based on relevance

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Runtime** | Node.js 18.x |
| **Framework** | Express.js 5.x |
| **Database** | MongoDB Atlas with Mongoose ODM |
| **Authentication** | JWT (jsonwebtoken) |
| **File Storage** | Cloudinary |
| **AI Processing** | Groq SDK |
| **File Upload** | Multer + Cloudinary Storage |
| **Password Hashing** | bcryptjs |
| **Validation** | Mongoose built-in validators |
| **Dev Tools** | Nodemon, ESLint |

## 📁 Project Structure

```
backend/
├── 📄 app.js                 # Express app configuration
├── 📄 server.js              # Server entry point
├── 📄 constants.js           # Application constants
├── 📄 package.json           # Dependencies and scripts
├── 📄 .env                   # Environment variables
├── 📄 .gitignore            # Git ignore rules
├── 📄 README.md             # This file
│
├── 📂 public/               # Static files
│   └── uploads/
│       └── documents/       # Local document storage (backup)
│
└── 📂 src/                  # Source code
    ├── 📂 controllers/      # Route handlers
    │   ├── auth.controller.js
    │   ├── document.controller.js
    │   └── notebook.controller.js
    │
    ├── 📂 db/              # Database configuration
    │   └── db.js
    │
    ├── 📂 middleware/      # Custom middleware
    │   ├── auth.middleware.js
    │   ├── cloudinary.middleware.js
    │   └── upload.middleware.js
    │
    ├── 📂 models/          # Database schemas
    │   ├── User.model.js
    │   ├── Notebook.model.js
    │   ├── Document.model.js
    │   ├── Chat.model.js
    │   └── AIInteraction.model.js
    │
    ├── 📂 routes/          # API routes
    │   ├── auth.route.js
    │   ├── notebook.route.js
    │   └── document.route.js
    │
    └── 📂 utils/           # Utility functions
        ├── ApiError.js
        ├── ApiResponse.js
        ├── asyncHandler.js
        ├── documentParser.js
        └── groq.service.js
```

## 🔧 Prerequisites

Before running this project, make sure you have:

- **Node.js** (version 18.x or higher)
- **npm** or **yarn** package manager
- **MongoDB Atlas** account and cluster
- **Cloudinary** account for file storage
- **Groq API** key for AI processing

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sujalkamble007/NoteBookLm.git
   cd NoteBookLm/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Set up environment variables** (see [Environment Variables](#environment-variables))

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 🔐 Environment Variables

Create a `.env` file in the backend root directory:

```env
# Server Configuration
PORT=4000
NODE_ENV=development

# Database
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net

# JWT Configuration
JWT_ACCESS_SECRET=your-super-secret-access-token-key
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Groq AI Configuration
GROQ_API_KEY=your-groq-api-key

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

### Environment Setup Guide

#### 1. MongoDB Atlas Setup
1. Create account at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new cluster
3. Get connection string: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net`
4. Add your IP to whitelist

#### 2. Cloudinary Setup
1. Sign up at [Cloudinary](https://cloudinary.com)
2. Get credentials from Dashboard
3. Copy Cloud Name, API Key, and API Secret

#### 3. Groq API Setup
1. Sign up at [Groq](https://console.groq.com)
2. Generate API key from dashboard
3. Copy the API key

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```
Server runs on `http://localhost:4000` with auto-reload

### Production Mode
```bash
npm start
```

### Scripts Available
```bash
npm run dev      # Start development server with nodemon
npm start        # Start production server
npm test         # Run tests (to be implemented)
```

## 📚 API Documentation

### Base URL
```
http://localhost:4000/api/v1
```

### 🔐 Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/users/register` | Register new user | No |
| POST | `/users/login` | Login user | No |
| POST | `/users/refresh-token` | Refresh access token | No |
| POST | `/users/logout` | Logout user | Yes |
| GET | `/users/me` | Get current user | Yes |
| PATCH | `/users/update-profile` | Update user profile | Yes |
| PATCH | `/users/change-password` | Change password | Yes |
| GET | `/users/stats` | Get user statistics | Yes |

#### Authentication Flow Example

**1. Register User**
```bash
curl -X POST http://localhost:4000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

**2. Login**
```bash
curl -X POST http://localhost:4000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "plan": "free"
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  },
  "message": "User logged in successfully"
}
```

### 📚 Notebook Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/notebooks/public` | Get public notebooks | No |
| POST | `/notebooks` | Create notebook | Yes |
| GET | `/notebooks` | Get user notebooks | Yes |
| GET | `/notebooks/:id` | Get notebook details | Yes |
| PATCH | `/notebooks/:id` | Update notebook | Yes |
| DELETE | `/notebooks/:id` | Delete notebook | Yes |
| POST | `/notebooks/:id/collaborators` | Add collaborator | Yes |
| DELETE | `/notebooks/:id/collaborators/:userId` | Remove collaborator | Yes |
| POST | `/notebooks/:id/summary` | Generate AI summary | Yes |
| POST | `/notebooks/:id/mindmap` | Generate mindmap | Yes (Premium) |
| POST | `/notebooks/:id/podcast` | Generate podcast | Yes (Premium) |

#### Notebook Examples

**Create Notebook**
```bash
curl -X POST http://localhost:4000/api/v1/notebooks \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Research Notes",
    "description": "AI and ML research compilation",
    "category": "research",
    "tags": ["ai", "machine-learning"],
    "isPublic": false
  }'
```

**Add Collaborator**
```bash
curl -X POST http://localhost:4000/api/v1/notebooks/notebook_id/collaborators \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "collaborator@example.com",
    "role": "editor"
  }'
```

### 📄 Document Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/documents/upload` | Upload documents | Yes |
| POST | `/documents/process/:id` | Process document | Yes |
| GET | `/documents/:id` | Get document | Yes |
| PUT | `/documents/:id` | Update document | Yes |
| DELETE | `/documents/:id` | Delete document | Yes |
| POST | `/documents/:id/embeddings` | Generate embeddings | Yes |
| GET | `/documents/notebook/:notebookId` | Get notebook documents | Yes |
| POST | `/documents/search` | Search documents | Yes |
| GET | `/documents/:id/status` | Get processing status | Yes |

#### Document Processing Examples

**Upload Documents**
```bash
curl -X POST http://localhost:4000/api/v1/documents/upload \
  -H "Authorization: Bearer your_jwt_token" \
  -F "documents=@document.pdf" \
  -F "documents=@research.docx" \
  -F "notebookId=notebook_id"
```

**Search Documents**
```bash
curl -X POST http://localhost:4000/api/v1/documents/search \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "artificial intelligence",
    "notebookId": "notebook_id",
    "page": 1,
    "limit": 10
  }'
```

## 🗄️ Database Models

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  avatar: String,
  provider: "local" | "google",
  isActive: Boolean,
  isEmailVerified: Boolean,
  totalNotebooks: Number,
  totalDocuments: Number,
  plan: "free" | "premium" | "enterprise",
  planExpiry: Date,
  refreshTokens: [{ token, createdAt }]
}
```

### Notebook Model
```javascript
{
  title: String,
  description: String,
  owner: ObjectId (User),
  collaborators: [{
    user: ObjectId (User),
    role: "viewer" | "editor" | "admin",
    addedAt: Date
  }],
  tags: [String],
  category: "research" | "education" | "business" | "personal" | "other",
  isPublic: Boolean,
  shareLink: String,
  aiSummary: String,
  keyTopics: [{ topic, confidence, sources }],
  mindmapData: { nodes, edges },
  processingStatus: { summary, mindmap, podcast }
}
```

### Document Model
```javascript
{
  title: String,
  originalName: String,
  filename: String,
  fileType: "pdf" | "csv" | "docx" | "txt" | "xlsx",
  mimeType: String,
  fileSize: Number,
  fileUrl: String (Cloudinary URL),
  notebook: ObjectId (Notebook),
  uploadedBy: ObjectId (User),
  extractedText: String,
  extractedData: Mixed,
  wordCount: Number,
  pageCount: Number,
  aiSummary: String,
  keyPoints: [{ point, importance, context }],
  entities: [{ text, type, confidence }],
  topics: [{ topic, relevance, keywords }],
  embeddings: [{ chunkId, text, vector, metadata }],
  processingStatus: { textExtraction, aiAnalysis, vectorization }
}
```

## 🤖 AI Integration

### Groq Service Features

The application uses Groq API for various AI operations:

```javascript
// Document Analysis
const analysis = await groqService.analyzeDocument(content, {
  type: 'pdf',
  language: 'english'
});

// Document Ranking for Search
const rankedDocs = await groqService.rankDocuments(query, documents);

// Mindmap Generation
const mindmap = await groqService.generateMindmap(content);

// Podcast Script Generation
const podcast = await groqService.generatePodcast(content, {
  style: 'conversational',
  duration: 'medium',
  hosts: 2
});
```

### AI Processing Pipeline

1. **Text Extraction** → Extract content from uploaded files
2. **Content Analysis** → Analyze with Groq AI for insights
3. **Entity Recognition** → Extract people, places, organizations
4. **Topic Modeling** → Identify key topics and themes
5. **Vectorization** → Create chunks for RAG implementation
6. **Summary Generation** → Create concise summaries

## 📎 File Processing

### Supported Formats

| Format | Extensions | Max Size | Processing |
|--------|------------|----------|------------|
| PDF | `.pdf` | 50MB | pdf-parse library |
| Word | `.docx`, `.doc` | 50MB | mammoth library |
| Text | `.txt` | 50MB | Direct reading |
| CSV | `.csv` | 50MB | csv-parser library |
| Excel | `.xlsx`, `.xls` | 50MB | Basic support |

### Processing Workflow

```mermaid
graph TD
    A[File Upload] → B[Cloudinary Storage]
    B → C[Text Extraction]
    C → D[AI Analysis]
    D → E[Entity Recognition]
    E → F[Topic Analysis]
    F → G[Vectorization]
    G → H[Search Index]
```

### File Processing Example

```javascript
// Automatic processing after upload
const document = await Document.create({
  title: file.originalname,
  fileUrl: cloudinaryUrl,
  notebook: notebookId,
  uploadedBy: userId,
  status: 'processing'
});

// Background processing
await processDocumentAsync(document._id);
```

## 🔒 Authentication System

### JWT Token Strategy

- **Access Token**: Short-lived (15 minutes) for API requests
- **Refresh Token**: Long-lived (7 days) for token renewal
- **Secure Storage**: HttpOnly cookies + Authorization header support

### Role-Based Access Control

```javascript
// Notebook Access Levels
const roles = {
  viewer: 1,    // Read-only access
  editor: 2,    // Read + Edit documents
  admin: 3,     // Full access except delete
  owner: 4      // Full control
};
```

### Protected Route Example

```javascript
// Middleware usage
router.use(protect);                           // Require authentication
router.use(checkSubscription('premium'));      // Require premium plan
router.use(rateLimitByUser(100, 900000));     // Rate limiting
```

## 👥 Collaboration Features

### Multi-User Support

- **Real-time Collaboration**: Share notebooks with multiple users
- **Permission Management**: Granular role-based access
- **Activity Tracking**: Monitor user actions and contributions

### Collaboration Workflow

1. **Create Notebook** → Owner creates notebook
2. **Add Collaborators** → Invite users via email
3. **Assign Roles** → Set appropriate permissions
4. **Share Resources** → Collaborative document access

## ⚠️ Error Handling

### Centralized Error Management

```javascript
// Custom Error Class
class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;
  }
}

// Global Error Handler
app.use((error, req, res, next) => {
  const { statusCode = 500, message } = error;
  res.status(statusCode).json(new ApiResponse(statusCode, null, message));
});
```

### Error Response Format

```json
{
  "statusCode": 400,
  "data": null,
  "message": "Validation error occurred",
  "success": false,
  "errors": ["Email is required", "Password must be at least 6 characters"]
}
```

## 🧪 Testing

### Test Structure (To be implemented)

```bash
backend/
├── tests/
│   ├── unit/
│   │   ├── models/
│   │   ├── controllers/
│   │   └── utils/
│   ├── integration/
│   │   ├── auth.test.js
│   │   ├── notebooks.test.js
│   │   └── documents.test.js
│   └── e2e/
│       └── api.test.js
```

### Running Tests

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests
npm test
```

## 🚀 Deployment

### Environment Setup

#### Development
```bash
npm run dev
```

#### Production
```bash
# Set production environment variables
export NODE_ENV=production

# Start production server
npm start
```

### Docker Deployment (Optional)

**Dockerfile**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 4000
CMD ["npm", "start"]
```

**Build and Run**
```bash
docker build -t notebooklm-backend .
docker run -p 4000:4000 --env-file .env notebooklm-backend
```

### Cloud Deployment Options

#### 1. Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

#### 2. Render
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically

#### 3. Digital Ocean App Platform
1. Create new app
2. Connect repository
3. Configure environment variables
4. Deploy

### Environment Variables for Production

```env
NODE_ENV=production
PORT=4000
MONGODB_URL=mongodb+srv://production-connection
JWT_ACCESS_SECRET=production-access-secret
JWT_REFRESH_SECRET=production-refresh-secret
CLOUDINARY_CLOUD_NAME=production-cloud
CLOUDINARY_API_KEY=production-api-key
CLOUDINARY_API_SECRET=production-api-secret
GROQ_API_KEY=production-groq-key
CORS_ORIGIN=https://your-frontend-domain.com
```

## 📈 Performance Considerations

### Database Optimization

```javascript
// Indexed fields for better query performance
notebookSchema.index({ owner: 1, createdAt: -1 });
documentSchema.index({ notebook: 1, createdAt: -1 });
documentSchema.index({ 
  title: 'text', 
  extractedText: 'text', 
  searchKeywords: 'text' 
});
```

### Caching Strategy

- **Memory Caching**: Frequently accessed documents
- **CDN**: Static file delivery via Cloudinary
- **Database Queries**: Index optimization for common queries

### Rate Limiting

```javascript
// User-based rate limiting
const rateLimitByUser = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  // Implementation for preventing API abuse
};
```

## 🔧 Monitoring and Logging

### Health Check Endpoint

```bash
GET /health

Response:
{
  "message": "NotebookLM Clone API is running!",
  "timestamp": "2024-10-20T10:30:00.000Z",
  "version": "1.0.0"
}
```

### Logging Strategy

- **Development**: Console logging with detailed error stacks
- **Production**: Structured logging to external services
- **Error Tracking**: Integration-ready for services like Sentry

## 🛡️ Security Features

### Data Protection

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Security**: Secure token generation and validation
- **File Validation**: Type and size restrictions
- **Input Sanitization**: Mongoose validation and sanitization
- **CORS Configuration**: Proper cross-origin setup

### Security Headers

```javascript
// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
}));
```

## 📝 API Usage Examples

### Complete Workflow Example

```bash
# 1. Register user
curl -X POST http://localhost:4000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'

# 2. Login and get token
TOKEN=$(curl -X POST http://localhost:4000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}' \
  | jq -r '.data.accessToken')

# 3. Create notebook
NOTEBOOK_ID=$(curl -X POST http://localhost:4000/api/v1/notebooks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Research","description":"AI Research Notes"}' \
  | jq -r '.data._id')

# 4. Upload document
curl -X POST http://localhost:4000/api/v1/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "documents=@research.pdf" \
  -F "notebookId=$NOTEBOOK_ID"

# 5. Search documents
curl -X POST http://localhost:4000/api/v1/documents/search \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"artificial intelligence","notebookId":"'$NOTEBOOK_ID'"}'
```

## 🔄 Version History

### Version 1.0.0 (Current)
- ✅ Complete authentication system
- ✅ Document upload and processing
- ✅ AI-powered analysis with Groq
- ✅ Collaborative notebooks
- ✅ Search functionality
- ✅ Cloudinary integration
- ✅ RESTful API design

### Upcoming Features
- 🔄 Chat system with documents
- 🔄 Real-time collaboration
- 🔄 Advanced AI interactions
- 🔄 Email notifications
- 🔄 Analytics dashboard
- 🔄 API rate limiting improvements

## 🤝 Contributing

### Development Setup

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Make changes and test**
4. **Commit changes**: `git commit -m 'Add amazing feature'`
5. **Push to branch**: `git push origin feature/amazing-feature`
6. **Open Pull Request**

### Code Style Guidelines

- Use **ESLint** configuration
- Follow **JavaScript Standard Style**
- Write **descriptive commit messages**
- Add **comments** for complex logic
- Update **documentation** for new features

### Pull Request Process

1. Update README.md with details of changes
2. Ensure all tests pass
3. Update version numbers if applicable
4. Get approval from code maintainers

## 📞 Support

### Getting Help

- **Issues**: [GitHub Issues](https://github.com/sujalkamble007/NoteBookLm/issues)
- **Email**: sujalkamble007@example.com
- **Documentation**: This README and inline code comments

### Common Issues

#### MongoDB Connection Error
```bash
Error: MongoNetworkError: failed to connect to server
```
**Solution**: Check MongoDB Atlas connection string and IP whitelist

#### Cloudinary Upload Fails
```bash
Error: Invalid API credentials
```
**Solution**: Verify Cloudinary environment variables

#### Groq API Error
```bash
Error: Unauthorized request to Groq API
```
**Solution**: Check GROQ_API_KEY in environment variables

## 📄 License

This project is licensed under the **ISC License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **MongoDB Atlas** for database hosting
- **Cloudinary** for file storage and processing
- **Groq** for AI processing capabilities
- **Express.js** community for excellent middleware
- **Node.js** ecosystem for robust packages

---

## 🎯 Quick Start Checklist

- [ ] Node.js 18.x installed
- [ ] MongoDB Atlas cluster created
- [ ] Cloudinary account set up
- [ ] Groq API key obtained
- [ ] Environment variables configured
- [ ] Dependencies installed (`npm install`)
- [ ] Development server running (`npm run dev`)
- [ ] API endpoints tested
- [ ] Ready for frontend integration! 🚀

---

**Built with ❤️ by [Sujal Kamble](https://github.com/sujalkamble007)**

*Last Updated: October 20, 2025*