# NotebookLM Clone - Full Stack Application

![React](https://img.shields.io/badge/React-19.x-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![Express](https://img.shields.io/badge/Express-5.x-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC)
![JWT](https://img.shields.io/badge/JWT-Authentication-orange)
![Cloudinary](https://img.shields.io/badge/Cloudinary-File_Storage-blue)
![Groq](https://img.shields.io/badge/Groq-AI_Processing-purple)

A modern, full-stack NotebookLM clone that combines powerful document processing, AI-powered analysis, collaborative notebooks, and an elegant user interface. Built with React + TypeScript frontend and Node.js + Express backend, featuring advanced RAG capabilities and real-time collaboration.

## 🌟 Project Overview

This NotebookLM clone is a comprehensive document management and AI analysis platform that allows users to upload, process, and collaborate on documents with AI-powered insights. The application features a beautiful, responsive UI built with Tailwind CSS and a robust backend API with advanced AI integration.

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Environment Setup](#-environment-setup)
- [Running the Application](#-running-the-application)
- [Features Walkthrough](#-features-walkthrough)
- [API Integration](#-api-integration)
- [Authentication Flow](#-authentication-flow)
- [File Processing Pipeline](#-file-processing-pipeline)
- [AI Integration](#-ai-integration)
- [Deployment](#-deployment)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [Troubleshooting](#-troubleshooting)
- [Component Documentation](#-component-documentation)
- [License](#-license)

## 🚀 Features

### 🎨 Frontend Features
- **Modern React 19 + TypeScript** architecture
- **Beautiful UI with Tailwind CSS** - Responsive, accessible, and modern design
- **Authentication Interface** - Login, Register, and Dashboard components
- **Protected Routes** - Secure navigation with JWT token management
- **Real-time API Integration** - Seamless backend connectivity
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **Form Validation** - Client-side validation with error handling
- **Loading States** - Smooth loading indicators and transitions
- **Error Boundaries** - Graceful error handling and recovery

### 🛠 Backend Features
- **Multi-format Document Processing** (PDF, DOCX, CSV, TXT, Excel)
- **AI-Powered Content Analysis** using Groq API
- **Collaborative Notebooks** with real-time sharing
- **Advanced Search** with AI-powered ranking
- **RAG Implementation** for document-based conversations
- **JWT Authentication** with refresh tokens
- **Role-based Access Control** (Owner, Admin, Editor, Viewer)
- **Cloudinary Integration** for file storage
- **RESTful API Design** with comprehensive endpoints

## 🛠 Tech Stack

### Frontend
| Category | Technology | Purpose |
|----------|------------|---------|
| **Framework** | React 19.x | UI Library with latest features |
| **Language** | TypeScript 5.x | Type safety and developer experience |
| **Styling** | Tailwind CSS 3.x | Utility-first CSS framework |
| **Routing** | React Router DOM | Client-side routing |
| **HTTP Client** | Axios | API communication |
| **Icons** | Lucide React | Beautiful SVG icons |
| **Build Tool** | Vite | Fast development and building |

### Backend
| Category | Technology | Purpose |
|----------|------------|---------|
| **Runtime** | Node.js 18.x | Server runtime |
| **Framework** | Express.js 5.x | Web application framework |
| **Database** | MongoDB Atlas | Cloud database |
| **ODM** | Mongoose | MongoDB object modeling |
| **Authentication** | JWT | Token-based authentication |
| **File Storage** | Cloudinary | Cloud file storage and processing |
| **AI Processing** | Groq SDK | AI-powered document analysis |
| **File Upload** | Multer | File upload middleware |

## 🏗 Architecture

```mermaid
graph TB
    subgraph "Frontend (React + TypeScript)"
        A[React App] --> B[Authentication Context]
        A --> C[Protected Routes]
        A --> D[UI Components]
        B --> E[Auth Service]
        D --> F[API Integration]
    end
    
    subgraph "Backend (Node.js + Express)"
        G[Express Server] --> H[Auth Middleware]
        G --> I[Route Handlers]
        I --> J[Controllers]
        J --> K[Services]
        K --> L[Database Models]
    end
    
    subgraph "External Services"
        M[MongoDB Atlas]
        N[Cloudinary]
        O[Groq AI API]
    end
    
    F --> G
    L --> M
    K --> N
    K --> O
```

## 📁 Project Structure

```
GenAI_Clone/
├── 📄 README.md                    # This file
├── 📄 package-lock.json           # Root dependencies lock
├── 📄 .gitignore                  # Git ignore rules
│
├── 📂 frontend/                   # React TypeScript Frontend
│   ├── 📄 package.json            # Frontend dependencies
│   ├── 📄 vite.config.ts         # Vite configuration
│   ├── 📄 tailwind.config.js     # Tailwind CSS configuration
│   ├── 📄 tsconfig.json          # TypeScript configuration
│   ├── 📄 index.html              # HTML template
│   ├── 📄 README.md               # Frontend documentation
│   │
│   ├── 📂 public/                 # Static assets
│   │   └── vite.svg
│   │
│   └── 📂 src/                    # Source code
│       ├── 📄 main.tsx            # Application entry point
│       ├── 📄 App.tsx             # Main App component
│       ├── 📄 index.css           # Global styles with Tailwind
│       │
│       ├── 📂 components/         # React components
│       │   ├── Home.tsx           # Landing page component
│       │   ├── Login.tsx          # Login form component
│       │   ├── Register.tsx       # Registration component
│       │   ├── Dashboard.tsx      # User dashboard
│       │   └── ProtectedRoute.tsx # Route protection
│       │
│       ├── 📂 contexts/           # React contexts
│       │   └── AuthContext.tsx    # Authentication context
│       │
│       ├── 📂 services/           # API services
│       │   └── authService.ts     # Authentication API calls
│       │
│       └── 📂 types/              # TypeScript type definitions
│           └── auth.ts            # Authentication types
│
└── 📂 backend/                    # Node.js Express Backend
    ├── 📄 package.json            # Backend dependencies
    ├── 📄 app.js                  # Express app configuration
    ├── 📄 server.js               # Server entry point
    ├── 📄 constants.js            # Application constants
    ├── 📄 .env                    # Environment variables
    ├── 📄 README.md               # Backend documentation
    │
    ├── 📂 public/                 # Static files
    └── 📂 src/                    # Source code
        ├── 📂 controllers/        # Route handlers
        ├── 📂 db/                 # Database configuration
        ├── 📂 middleware/         # Custom middleware
        ├── 📂 models/             # Database schemas
        ├── 📂 routes/             # API routes
        └── 📂 utils/              # Utility functions
```

## 🔧 Prerequisites

Before running this project, ensure you have:

### System Requirements
- **Node.js** (version 18.x or higher)
- **npm** or **yarn** package manager
- **Git** for version control

### External Services
- **MongoDB Atlas** account and cluster
- **Cloudinary** account for file storage
- **Groq API** key for AI processing

## ⚡ Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/sujalkamble007/NoteBookLm.git
cd NoteBookLm
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Start backend server
npm run dev
```
Backend will run on `http://localhost:4000`

### 3. Frontend Setup
```bash
# Navigate to frontend directory (new terminal)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Frontend will run on `http://localhost:5174`

### 4. Access the Application
- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:4000
- **API Health**: http://localhost:4000/health

## 🔐 Environment Setup

### Backend Environment Variables
Create `.env` file in `/backend` directory:

```env
# Server Configuration
PORT=4000
NODE_ENV=development

# Database
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/notebooklm

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
CORS_ORIGIN=http://localhost:5174
```

### Frontend Environment Variables
Create `.env` file in `/frontend` directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:4000/api/v1
VITE_API_HEALTH_URL=http://localhost:4000/health

# Environment
VITE_NODE_ENV=development
```

### Service Setup Guide

#### 1. MongoDB Atlas
1. Visit [MongoDB Atlas](https://cloud.mongodb.com)
2. Create account and new cluster
3. Get connection string
4. Add your IP to network access
5. Create database user

#### 2. Cloudinary
1. Sign up at [Cloudinary](https://cloudinary.com)
2. Access dashboard for credentials
3. Copy Cloud Name, API Key, and API Secret

#### 3. Groq API
1. Register at [Groq Console](https://console.groq.com)
2. Generate API key
3. Copy the API key

## 🚀 Running the Application

### Development Mode

**Backend (Terminal 1):**
```bash
cd backend
npm run dev
```

**Frontend (Terminal 2):**
```bash
cd frontend
npm run dev
```

### Production Mode

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

### Available Scripts

#### Backend Scripts
```bash
npm run dev      # Development server with auto-reload
npm start        # Production server
npm test         # Run tests
```

#### Frontend Scripts
```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🎯 Features Walkthrough

### 1. **Landing Page (Home)**
- **Hero section** with gradient background and animations
- **API health status** checker with real-time connectivity
- **Feature showcase** with interactive cards
- **API endpoints overview** with categorized documentation
- **Quick start guide** with step-by-step instructions

### 2. **Authentication System**
- **Registration** with form validation
- **Login** with demo credentials option
- **JWT token management** with automatic refresh
- **Protected routes** with authentication checks
- **User profile** management

### 3. **Dashboard**
- **User profile** display and editing
- **Statistics** showing notebooks and documents count
- **Account details** with verification status
- **Authentication testing** with success indicators

### 4. **Responsive Design**
- **Mobile-first** approach with Tailwind CSS
- **Tablet optimization** with grid layouts
- **Desktop enhancement** with advanced features
- **Accessibility** with proper ARIA labels and keyboard navigation

## 🔗 API Integration

### Authentication Flow
```typescript
// Login example
const response = await authService.login(email, password);
// Automatically stores tokens and updates context

// Protected API calls
const userProfile = await authService.getCurrentUser();
// Automatically includes authorization headers
```

### API Service Architecture
```typescript
// services/authService.ts
class AuthService {
  private baseURL = import.meta.env.VITE_API_BASE_URL;
  
  async login(email: string, password: string) {
    // Handle login logic
  }
  
  async register(name: string, email: string, password: string) {
    // Handle registration logic
  }
  
  async testConnection() {
    // Health check endpoint
  }
}
```

## 🔒 Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    
    U->>F: Enter credentials
    F->>B: POST /api/v1/users/login
    B->>DB: Verify user credentials
    DB-->>B: User data
    B-->>F: JWT tokens + user data
    F->>F: Store tokens locally
    F-->>U: Redirect to dashboard
    
    Note over F,B: Subsequent API calls
    F->>B: API request with Authorization header
    B->>B: Verify JWT token
    B-->>F: Protected resource
```

## 📄 File Processing Pipeline

```mermaid
graph LR
    A[File Upload] --> B[Cloudinary Storage]
    B --> C[Text Extraction]
    C --> D[AI Analysis]
    D --> E[Entity Recognition]
    E --> F[Topic Analysis]
    F --> G[Vector Embeddings]
    G --> H[Search Index]
    H --> I[Document Ready]
```

## 🤖 AI Integration

### Document Processing
- **Text extraction** from multiple file formats
- **Content analysis** with Groq AI
- **Entity recognition** (people, places, organizations)
- **Topic modeling** and keyword extraction
- **Intelligent summarization**

### Search & Retrieval
- **Vector embeddings** for semantic search
- **AI-powered ranking** of search results
- **Context-aware** document recommendations
- **RAG implementation** for document conversations

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)

#### Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from frontend directory
cd frontend
vercel

# Set environment variables in Vercel dashboard
```

#### Netlify
```bash
# Build for production
npm run build

# Deploy dist folder to Netlify
# Set environment variables in Netlify dashboard
```

### Backend Deployment (Railway/Render)

#### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy from backend directory
cd backend
railway login
railway init
railway up
```

#### Render
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically from `backend/` directory

### Environment Variables for Production

**Frontend (.env.production):**
```env
VITE_API_BASE_URL=https://your-api-domain.com/api/v1
VITE_API_HEALTH_URL=https://your-api-domain.com/health
VITE_NODE_ENV=production
```

**Backend (.env.production):**
```env
NODE_ENV=production
PORT=4000
MONGODB_URL=mongodb+srv://production-connection
CORS_ORIGIN=https://your-frontend-domain.com
# ... other production variables
```

## 🧪 Testing

### Frontend Testing
```bash
cd frontend

# Unit tests (to be implemented)
npm run test

# E2E tests (to be implemented)
npm run test:e2e

# Component testing with Storybook (future)
npm run storybook
```

### Backend Testing
```bash
cd backend

# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# API tests
npm run test:api
```

## 🎨 Component Documentation

### Core Components

#### AuthContext
Manages global authentication state
```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
}
```

#### ProtectedRoute
Handles route protection based on authentication
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
}
```

#### Home Component
Landing page with API health checking and feature showcase

#### Dashboard Component
User profile management and statistics display

### Styling System

#### Tailwind Configuration
- **Custom color palette** with primary and gray scales
- **Custom animations** (fade-in, slide-up, bounce-gentle)
- **Responsive breakpoints** for mobile-first design
- **Custom utility classes** for buttons, inputs, and cards

## 🔧 Troubleshooting

### Common Frontend Issues

#### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
npx vite --clearCache
```

#### TypeScript Errors
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Update type definitions
npm update @types/react @types/react-dom
```

### Common Backend Issues

#### MongoDB Connection
```bash
Error: MongoNetworkError
```
**Solution**: Check MongoDB Atlas connection string and IP whitelist

#### Cloudinary Issues
```bash
Error: Invalid API credentials
```
**Solution**: Verify Cloudinary environment variables

#### CORS Issues
```bash
Access to fetch blocked by CORS policy
```
**Solution**: Check CORS_ORIGIN in backend environment variables

### Performance Optimization

#### Frontend
- **Code splitting** with React.lazy()
- **Image optimization** with proper formats
- **Bundle analysis** with Vite bundle analyzer
- **Caching strategies** for API responses

#### Backend
- **Database indexing** for frequent queries
- **Response caching** for static data
- **File compression** with gzip
- **Rate limiting** implementation

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make changes**
   - Follow existing code patterns
   - Add proper TypeScript types
   - Update tests if applicable
4. **Test your changes**
   ```bash
   # Test frontend
   cd frontend && npm run lint && npm run build
   
   # Test backend
   cd backend && npm test
   ```
5. **Commit and push**
   ```bash
   git commit -m "feat: add amazing feature"
   git push origin feature/amazing-feature
   ```
6. **Create Pull Request**

### Code Style Guidelines

#### Frontend
- Use **TypeScript** for all new code
- Follow **React best practices** with hooks
- Use **Tailwind CSS** for styling
- Implement **proper error handling**
- Add **loading states** for async operations

#### Backend
- Use **ES6+ JavaScript** features
- Follow **RESTful API** conventions
- Implement **proper error handling**
- Add **input validation**
- Write **descriptive commit messages**

## 📱 Mobile Responsiveness

### Breakpoint Strategy
```css
/* Mobile First Approach */
.component {
  @apply text-sm px-4 py-2;           /* Mobile (default) */
  @apply sm:text-base sm:px-6 sm:py-3; /* Tablet (640px+) */
  @apply lg:text-lg lg:px-8 lg:py-4;   /* Desktop (1024px+) */
}
```

### Mobile Features
- **Touch-friendly** buttons and inputs
- **Swipe gestures** for navigation
- **Responsive typography** scaling
- **Optimized images** for different screen densities

## 📊 Analytics & Monitoring

### Frontend Analytics
- **User interaction** tracking
- **Performance metrics** monitoring
- **Error tracking** with boundaries
- **A/B testing** capabilities

### Backend Monitoring
- **API endpoint** performance
- **Database query** optimization
- **Error rate** monitoring
- **Resource usage** tracking

## 🔒 Security Considerations

### Frontend Security
- **XSS protection** with proper sanitization
- **CSRF protection** with tokens
- **Secure token storage** with httpOnly cookies
- **Input validation** on all forms

### Backend Security
- **JWT token** security with short expiry
- **Password hashing** with bcryptjs
- **File upload** validation and sanitization
- **Rate limiting** to prevent abuse
- **CORS configuration** for secure origins

## 📚 Learning Resources

### Frontend Technologies
- [React 19 Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS Guide](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev/guide)

### Backend Technologies
- [Node.js Documentation](https://nodejs.org/docs)
- [Express.js Guide](https://expressjs.com/guide)
- [MongoDB Manual](https://docs.mongodb.com/manual)
- [JWT Introduction](https://jwt.io/introduction)

## 🎯 Future Roadmap

### Short-term Goals
- [ ] **Real-time chat** with documents
- [ ] **File drag & drop** interface
- [ ] **Advanced search** with filters
- [ ] **User settings** page
- [ ] **Email notifications**

### Long-term Vision
- [ ] **Mobile app** with React Native
- [ ] **Collaborative editing** with operational transforms
- [ ] **Advanced AI** interactions
- [ ] **Plugin system** for extensibility
- [ ] **Analytics dashboard**

## 📞 Support & Community

### Getting Help
- **GitHub Issues**: [Report bugs or request features](https://github.com/sujalkamble007/NoteBookLm/issues)
- **Discussions**: [Community discussions and Q&A](https://github.com/sujalkamble007/NoteBookLm/discussions)
- **Email**: sujalkamble007@example.com

### Community Guidelines
- Be respectful and inclusive
- Provide detailed bug reports
- Share knowledge and help others
- Follow the code of conduct

## 📄 License

This project is licensed under the **ISC License**. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

### Technologies & Services
- **React Team** for the amazing frontend framework
- **Vercel** for Vite and deployment platform
- **MongoDB** for Atlas database hosting
- **Cloudinary** for file storage and processing
- **Groq** for AI processing capabilities
- **Tailwind Labs** for the utility-first CSS framework

### Contributors
- **Sujal Kamble** - Full-stack development and project architecture

---

## 📖 Component Documentation

For detailed information about specific parts of the application:

### 📱 Frontend Documentation
**[Frontend README →](./frontend/README.md)**
- React components architecture
- TypeScript type definitions
- Tailwind CSS styling guide
- Authentication flow implementation
- API integration patterns
- UI/UX design decisions

### 🛠 Backend Documentation  
**[Backend README →](./backend/README.md)**
- RESTful API endpoints
- Database models and schemas
- Authentication and security
- File processing pipeline
- AI integration with Groq
- Deployment and scaling

---

## 🎯 Quick Development Checklist

### Initial Setup
- [ ] Node.js 18.x installed
- [ ] Git repository cloned
- [ ] MongoDB Atlas cluster created
- [ ] Cloudinary account set up
- [ ] Groq API key obtained
- [ ] Environment variables configured

### Frontend Setup
- [ ] Dependencies installed (`cd frontend && npm install`)
- [ ] Tailwind CSS configured
- [ ] Environment variables set
- [ ] Development server running (`npm run dev`)

### Backend Setup  
- [ ] Dependencies installed (`cd backend && npm install`)
- [ ] Database connection established
- [ ] External services configured
- [ ] Development server running (`npm run dev`)

### Verification
- [ ] Frontend loads at http://localhost:5174
- [ ] Backend API responds at http://localhost:4000
- [ ] Authentication flow works
- [ ] API health check passes
- [ ] Ready for development! 🚀

---

**Built with ❤️ by [Sujal Kamble](https://github.com/sujalkamble007)**

*Last Updated: October 20, 2025*