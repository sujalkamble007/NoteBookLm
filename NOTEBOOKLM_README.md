# NotebookLM Clone - Document Q&A System

A complete implementation of Google's NotebookLM-like functionality using:
- **Hugging Face Embeddings** for text vectorization
- **MongoDB Atlas Vector Search** for semantic search
- **Groq API (LLaMA 3.1)** for intelligent responses
- **MERN Stack** for full-stack development

## 🌟 Features

### Core NotebookLM Functionality
- **📄 Document Upload & Processing**: Support for PDF, DOCX, TXT, CSV, XLSX files
- **🧠 AI-Powered Q&A**: Ask natural language questions about your documents
- **📚 Notebook Organization**: Group related documents together
- **🔍 Vector-Based Search**: Semantic search using embeddings
- **📊 Document Insights**: Auto-generated summaries and key insights
- **💬 Conversational Interface**: Chat-like Q&A experience with source citations

### Technical Features
- **🔐 JWT Authentication**: Secure user authentication with refresh tokens
- **👥 Collaboration**: Multi-user notebook sharing (coming soon)
- **⚡ Real-time Processing**: Background document processing
- **📱 Responsive UI**: Works on desktop and mobile
- **🎯 High Accuracy**: Confidence scores and source references

## 🏗 Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   External      │
│   (React)       │    │  (Node.js)      │    │   Services      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Document      │◄──►│ • Upload API    │◄──►│ • HuggingFace   │
│   Upload        │    │ • Vector Search │    │   Embeddings    │
│ • Chat UI       │    │ • Q&A Engine    │    │ • MongoDB Atlas │
│ • Notebook      │    │ • Auth System   │    │   Vector Search │
│   Management    │    │ • File Parser   │    │ • Groq API      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account with Vector Search enabled
- Hugging Face API key
- Groq API key

### 1. Environment Setup

**Backend (.env):**
```env
# Database
MONGODB_URL=your_mongodb_atlas_connection_string

# API Keys
HF_API_KEY=your_huggingface_api_key
GROQ_API_KEY=your_groq_api_key

# JWT Secrets
JWT_ACCESS_SECRET=your_jwt_access_secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_SECRET=your_jwt_refresh_secret
JWT_REFRESH_EXPIRY=7d

# Server Config
PORT=4000
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

**Frontend (.env):**
```env
VITE_API_BASE_URL=http://localhost:4000/api/v1
VITE_BACKEND_URL=http://localhost:4000
```

### 2. Installation

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 3. MongoDB Atlas Vector Search Setup

1. Run the setup script:
```bash
cd backend
npm run setup-vector
```

2. Follow the instructions to create the vector index in MongoDB Atlas:
   - Go to Atlas Dashboard → Your Cluster → Search
   - Create Index → JSON Editor
   - Use the configuration provided by the setup script
   - Name: `vector_index`
   - Collection: `documents`

### 4. Start the Application

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` to access the application.

## 📖 Usage Guide

### 1. Document Upload
1. Navigate to the "Upload" tab
2. Drag & drop or select your documents
3. Wait for processing to complete (background chunking and embedding generation)

### 2. Creating Notebooks
1. Go to "Notebooks" tab
2. Click "New Notebook"
3. Add documents to organize related content

### 3. Asking Questions
1. Go to "Chat" tab
2. Type your question in natural language
3. Get AI-powered answers with source references
4. View confidence scores and document citations

### 4. Document Management
1. View all uploaded documents in "Documents" tab
2. See processing status, summaries, and key insights
3. Organize documents by file type and date

## 🔧 API Endpoints

### Authentication
```
POST /api/v1/users/register    # User registration
POST /api/v1/users/login       # User login
POST /api/v1/users/logout      # User logout
GET  /api/v1/users/me          # Get current user
```

### Documents
```
POST /api/v1/documents/upload          # Upload documents
POST /api/v1/documents/query           # Q&A endpoint
GET  /api/v1/documents                 # Get user documents
GET  /api/v1/documents/:id             # Get document details
DELETE /api/v1/documents/:id           # Delete document
```

### Notebooks
```
POST /api/v1/notebooks                 # Create notebook
GET  /api/v1/notebooks                 # Get user notebooks
GET  /api/v1/notebooks/:id             # Get notebook details
PATCH /api/v1/notebooks/:id            # Update notebook
DELETE /api/v1/notebooks/:id           # Delete notebook
```

## 📊 Document Processing Pipeline

1. **File Upload** → Multer middleware handles file storage
2. **Text Extraction** → Parse content based on file type (PDF, DOCX, etc.)
3. **Text Chunking** → Split content into 500-character chunks with 50-char overlap
4. **Embedding Generation** → Create 384-dimensional vectors using HuggingFace
5. **Storage** → Save chunks + embeddings to MongoDB
6. **AI Analysis** → Generate summary, insights, and suggested questions using Groq

## 🔍 Q&A Process

1. **Question Input** → User submits natural language question
2. **Query Embedding** → Generate embedding for the question
3. **Vector Search** → Find most similar document chunks using MongoDB Atlas
4. **Context Assembly** → Combine relevant chunks into context
5. **LLM Processing** → Send context + question to Groq API
6. **Response** → Return answer with sources and confidence score

## 🛠 Technical Implementation

### Embedding Service
- **Model**: `sentence-transformers/all-MiniLM-L6-v2`
- **Dimensions**: 384
- **Chunking**: 500 chars with 50 char overlap
- **Batch Processing**: Up to 5 texts per batch

### Vector Search
- **Index Type**: `knnVector` with cosine similarity
- **Search**: Atlas Vector Search aggregation pipeline
- **Filtering**: User-based access control
- **Ranking**: Similarity scores + metadata filtering

### Document Parser
- **PDF**: `pdf-parse` library
- **DOCX**: `mammoth` for Word documents
- **Excel**: `xlsx` for spreadsheet processing
- **CSV/TXT**: Native Node.js file handling
- **Validation**: File type, size, and content validation

### LLM Integration
- **Provider**: Groq API
- **Model**: LLaMA 3.1 70B Versatile
- **Context Window**: Optimized for document chunks
- **Response Quality**: System prompts for accurate, sourced answers

## 🎯 Advanced Features

### Smart Chunking
```javascript
// Intelligent text splitting with sentence boundary detection
const chunks = embeddingService.chunkText(content, 500, 50);
```

### Confidence Scoring
```javascript
// Calculate confidence based on similarity scores
const confidence = Math.min(Math.round(avgSimilarity * 100), 95);
```

### Source Attribution
```javascript
// Track document sources for each answer
const sources = results.map(result => ({
  documentId: result.documentId,
  title: result.title,
  similarity: result.similarity,
  textPreview: result.text.substring(0, 200)
}));
```

## 🔒 Security Features

- **Authentication**: JWT access/refresh token pattern
- **Authorization**: User-based document access control
- **File Validation**: Type, size, and content validation
- **Input Sanitization**: XSS and injection prevention
- **Rate Limiting**: API request throttling (planned)

## 📈 Monitoring & Analytics

### Document Statistics
- Processing times and success rates
- File type distribution
- User engagement metrics
- Search query patterns

### Performance Metrics
- Embedding generation speed
- Vector search response times
- LLM response quality scores
- Error rates and types

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests (when available)
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🙋‍♂️ Support

For questions and support:
- Create an issue in the GitHub repository
- Check the documentation and setup guides
- Review the API endpoint examples

## 🚧 Roadmap

- [ ] Real-time collaboration
- [ ] Advanced document types (images, audio)
- [ ] Custom embedding models
- [ ] Multi-language support
- [ ] API rate limiting
- [ ] Comprehensive testing suite
- [ ] Docker containerization
- [ ] Performance optimization