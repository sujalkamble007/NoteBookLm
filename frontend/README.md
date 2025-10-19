# NotebookLM Clone - Frontend

![React](https://img.shields.io/badge/React-19.x-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Vite](https://img.shields.io/badge/Vite-7.x-purple)
![Axios](https://img.shields.io/badge/Axios-HTTP_Client-green)

A modern React TypeScript frontend application for testing the NotebookLM Clone backend authentication system.

## 🚀 Features

### Authentication Testing
- **User Registration** with form validation
- **User Login** with JWT token management
- **Protected Routes** with authentication guards
- **Profile Management** with real-time updates
- **Automatic Token Refresh** for seamless experience
- **Demo Credentials** for quick testing

### User Interface
- **Modern Design** with responsive layout
- **Real-time API Status** monitoring
- **Interactive Dashboard** showing user stats
- **Form Validation** with error handling
- **Loading States** and success messages
- **Mobile-First Design** approach

### Developer Experience
- **TypeScript** for type safety
- **Hot Module Replacement** for fast development
- **Environment Configuration** for different stages
- **API Service Layer** with interceptors
- **Context-based State Management**

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 19.x with TypeScript |
| **Build Tool** | Vite 7.x |
| **Routing** | React Router DOM |
| **HTTP Client** | Axios with interceptors |
| **Icons** | Lucide React |
| **Styling** | Custom CSS with CSS Grid/Flexbox |
| **State Management** | React Context API |
| **Type Checking** | TypeScript 5.x |

## 📁 Project Structure

```
frontend/
├── 📄 index.html           # HTML template
├── 📄 package.json         # Dependencies and scripts
├── 📄 tsconfig.json        # TypeScript configuration
├── 📄 vite.config.ts       # Vite configuration
├── 📄 .env                 # Environment variables
├── 📄 README.md            # This file
│
├── 📂 public/              # Static assets
├── 📂 src/                 # Source code
│   ├── 📄 main.tsx         # Application entry point
│   ├── 📄 App.tsx          # Main App component with routing
│   ├── 📄 App.css          # Global styles
│   ├── 📄 index.css        # Base CSS
│   │
│   ├── 📂 components/      # React components
│   │   ├── Dashboard.tsx   # Protected dashboard
│   │   ├── Home.tsx        # Landing page
│   │   ├── Login.tsx       # Login form
│   │   ├── Register.tsx    # Registration form
│   │   └── ProtectedRoute.tsx # Route guard
│   │
│   ├── 📂 contexts/        # React contexts
│   │   └── AuthContext.tsx # Authentication state
│   │
│   ├── 📂 services/        # API services
│   │   └── authService.ts  # Authentication API calls
│   │
│   ├── 📂 types/           # TypeScript types
│   │   └── auth.ts         # Auth-related types
│   │
│   └── 📂 assets/          # Static assets
```

## 🔧 Prerequisites

- **Node.js** (version 18.x or higher)
- **npm** or **yarn** package manager
- **Backend API** running on port 4000

## 📦 Installation

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # .env file is already created with default values
   # Update if your backend runs on different port
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

## 🔐 Environment Configuration

The `.env` file contains:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:4000/api/v1
VITE_BACKEND_URL=http://localhost:4000

# Development
VITE_NODE_ENV=development
```

**Environment Variables Explained:**
- `VITE_API_BASE_URL`: Base URL for API endpoints
- `VITE_BACKEND_URL`: Backend server URL for health checks
- `VITE_NODE_ENV`: Environment mode

## 🚀 Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run ESLint
npm run lint
```

## 📱 Application Pages

### 🏠 Home Page (`/`)
- **API Health Status** with real-time connection testing
- **Feature Overview** of backend capabilities
- **API Endpoints** documentation
- **Quick Start Guide** for testing
- **Navigation** to auth pages

### 🔐 Login Page (`/login`)
- **Email/Password** authentication form
- **Demo Credentials** button for quick testing
- **Form Validation** with error messages
- **Password Visibility** toggle
- **Redirect** to dashboard on success

### 📝 Register Page (`/register`)
- **User Registration** form with validation
- **Password Confirmation** matching
- **Real-time Validation** feedback
- **Automatic Login** after registration
- **Redirect** to dashboard on success

### 📊 Dashboard Page (`/dashboard`) - Protected
- **User Profile** information display
- **Profile Editing** with inline forms
- **User Statistics** (notebooks, documents count)
- **Account Details** (verification, plan, etc.)
- **Authentication Testing** status indicators
- **Logout** functionality

## 🔒 Authentication Flow

### Registration Process
1. User fills registration form
2. Frontend validates input data
3. API call to `/api/v1/users/register`
4. JWT tokens stored in localStorage
5. User redirected to dashboard
6. Auth context updated

### Login Process
1. User enters credentials
2. Frontend validates form
3. API call to `/api/v1/users/login`
4. JWT tokens stored securely
5. User redirected to dashboard
6. Profile data fetched

### Token Management
```typescript
// Automatic token refresh on API calls
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Attempt token refresh
      // Retry original request
      // Redirect to login if refresh fails
    }
  }
);
```

### Protected Routes
```typescript
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } 
/>
```

## 🎨 Styling and Design

### Design System
- **Color Palette**: Modern blue/purple gradients
- **Typography**: Inter font family
- **Spacing**: Consistent 8px grid system
- **Components**: Reusable button and form styles
- **Responsive**: Mobile-first approach

### CSS Architecture
```css
/* Global styles in App.css */
.auth-container { /* Auth page layouts */ }
.dashboard-container { /* Dashboard layouts */ }
.home-container { /* Landing page styles */ }

/* Component-specific styles */
.auth-card { /* Login/Register forms */ }
.status-card { /* API health display */ }
.feature-card { /* Feature showcases */ }
```

### Responsive Breakpoints
```css
@media (max-width: 768px) {
  /* Mobile styles */
  .hero-content h1 { font-size: 2.5rem; }
  .dashboard-content { padding: 1rem; }
}
```

## 🧪 Testing the Authentication

### Quick Test Workflow

1. **Start Backend Server**
   ```bash
   cd ../backend
   npm run dev
   ```

2. **Start Frontend**
   ```bash
   npm run dev
   ```

3. **Test API Connection**
   - Visit home page
   - Check green "API Connected" status
   - If red, ensure backend is running

4. **Test Registration**
   - Click "Create Account"
   - Fill form with valid data
   - Submit and verify redirect

5. **Test Login**
   - Click "Fill Demo Credentials" (if available)
   - Or use registered credentials
   - Verify dashboard access

6. **Test Protected Routes**
   - Try accessing `/dashboard` without login
   - Should redirect to login page
   - Login and verify access granted

7. **Test Profile Updates**
   - Edit profile information
   - Verify changes persist
   - Check error handling

### Demo Credentials
The login form includes a "Fill Demo Credentials" button that populates:
```
Email: demo@example.com
Password: demo123456
```

*Note: You'll need to register this user first*

## 🔄 API Integration

### Service Layer Architecture
```typescript
// Centralized API service
class AuthService {
  async login(data: LoginData): Promise<AuthResponse>
  async register(data: RegisterData): Promise<AuthResponse>
  async getCurrentUser(): Promise<User>
  async updateProfile(data: UpdateData): Promise<User>
  // ... other methods
}
```

### Error Handling
```typescript
// Global error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    // Process API error responses
    // Refresh tokens automatically
    return Promise.reject(error);
  }
);
```

### State Management
```typescript
// Auth Context provides:
const {
  user,           // Current user data
  loading,        // Loading state
  isAuthenticated, // Auth status
  login,          // Login function
  register,       // Register function
  logout,         // Logout function
  updateProfile   // Profile update function
} = useAuth();
```

## 🐛 Troubleshooting

### Common Issues

#### Backend Connection Failed
```
Error: Failed to connect to API
```
**Solutions:**
1. Ensure backend server is running on port 4000
2. Check MongoDB connection in backend
3. Verify CORS settings in backend
4. Check firewall/network settings

#### CORS Errors
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solutions:**
1. Verify backend CORS configuration
2. Check `withCredentials: true` in axios config
3. Ensure backend allows frontend origin

#### Token Refresh Issues
```
Error: Token invalid or expired
```
**Solutions:**
1. Check JWT secret configuration in backend
2. Verify token expiry times
3. Clear localStorage and login again
4. Check refresh token implementation

#### Build Errors
```
TypeScript compilation errors
```
**Solutions:**
1. Run `npm run lint` to check for issues
2. Verify all imports have proper types
3. Check tsconfig.json configuration
4. Update dependencies if needed

### Development Tips

1. **Hot Reload**: Changes auto-refresh in development
2. **Network Tab**: Monitor API calls in browser DevTools
3. **Console Logs**: Check browser console for errors
4. **LocalStorage**: Inspect stored tokens in DevTools
5. **React DevTools**: Install for component debugging

## 🔧 Customization

### Adding New Routes
```typescript
// In App.tsx
<Route path="/new-page" element={<NewComponent />} />

// For protected routes
<Route 
  path="/protected" 
  element={
    <ProtectedRoute>
      <NewProtectedComponent />
    </ProtectedRoute>
  } 
/>
```

### Adding New API Endpoints
```typescript
// In authService.ts
async newEndpoint(data: any): Promise<any> {
  const response = await api.post('/new-endpoint', data);
  return response.data;
}

// In component
const { data } = await authService.newEndpoint(payload);
```

### Styling Components
```css
/* Add to App.css */
.new-component {
  /* Your styles */
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}
```

## 🚀 Production Deployment

### Build for Production
```bash
npm run build
```

### Environment Variables for Production
```env
VITE_API_BASE_URL=https://your-api-domain.com/api/v1
VITE_BACKEND_URL=https://your-api-domain.com
VITE_NODE_ENV=production
```

### Deployment Options

#### 1. Netlify
```bash
# Build command: npm run build
# Publish directory: dist
# Environment variables: Set in Netlify dashboard
```

#### 2. Vercel
```bash
# Automatic deployment from GitHub
# Build settings: Framework Preset: Vite
# Environment variables: Set in Vercel dashboard
```

#### 3. Static Hosting
```bash
npm run build
# Upload 'dist' folder to any static hosting service
```

## 📈 Performance Optimization

### Code Splitting
```typescript
// Lazy load components
const Dashboard = lazy(() => import('./components/Dashboard'));

// Wrap in Suspense
<Suspense fallback={<div>Loading...</div>}>
  <Dashboard />
</Suspense>
```

### Bundle Analysis
```bash
npm run build
# Analyze bundle size and optimize imports
```

### Caching Strategy
- API responses cached in memory
- Images optimized with Vite
- Browser caching for static assets

## 🤝 Contributing

### Development Workflow
1. Create feature branch
2. Make changes with TypeScript
3. Test authentication flow
4. Run linting: `npm run lint`
5. Build for production: `npm run build`
6. Submit pull request

### Code Style
- Use TypeScript for all new code
- Follow React functional components pattern
- Use custom hooks for reusable logic
- Implement proper error boundaries
- Add proper type annotations

## 📞 Support

### Getting Help
- **Issues**: Create GitHub issue for bugs
- **Features**: Request new authentication features
- **Documentation**: Refer to inline code comments

### Development Server
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:4000
- **API Docs**: Check backend README

---

## 🎯 Testing Checklist

### Authentication Tests
- [ ] API health check works
- [ ] User registration with validation
- [ ] User login with credentials
- [ ] JWT token storage and retrieval
- [ ] Automatic token refresh
- [ ] Protected route access
- [ ] Profile update functionality
- [ ] Logout and token cleanup
- [ ] Error handling and display
- [ ] Responsive design on mobile

### Ready to Test! 🚀

Your frontend authentication testing interface is ready. Start the development server and begin testing your NotebookLM Clone backend authentication system!

---

**Built with ❤️ using React + TypeScript + Vite**

*Last Updated: October 20, 2025*
