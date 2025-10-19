import React, { useState, useEffect } from 'react';
import authService from '../services/authService';
import { 
  Server, 
  CheckCircle, 
  XCircle, 
  Loader, 
  Database, 
  Cloud, 
  Zap,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface HealthData {
  message: string;
  timestamp: string;
  version: string;
}

const Home: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const checkAPIHealth = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const health = await authService.testConnection();
      setHealthData(health);
    } catch (err: any) {
      setError('Failed to connect to API. Make sure the backend server is running on port 4000.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAPIHealth();
  }, []);

  const features = [
    {
      icon: <Database size={24} />,
      title: 'Authentication System',
      description: 'JWT-based authentication with access and refresh tokens',
      status: 'ready'
    },
    {
      icon: <Cloud size={24} />,
      title: 'File Processing',
      description: 'Upload and process PDF, DOCX, CSV, TXT, and Excel files',
      status: 'ready'
    },
    {
      icon: <Zap size={24} />,
      title: 'AI Integration',
      description: 'Groq API for document analysis and content generation',
      status: 'ready'
    }
  ];

  return (
    <div className="home-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>NotebookLM Clone</h1>
          <p>
            A powerful backend API for document processing, AI-powered analysis, 
            and collaborative notebooks with authentication testing interface.
          </p>
          <div className="hero-buttons">
            <a href="/login" className="primary-button">
              Test Authentication
              <ArrowRight size={20} />
            </a>
            <a href="/register" className="secondary-button">
              Create Account
            </a>
          </div>
        </div>
      </div>

      {/* API Health Status */}
      <div className="status-section">
        <div className="status-card">
          <div className="status-header">
            <Server size={24} />
            <h2>API Health Status</h2>
            <button 
              onClick={checkAPIHealth} 
              disabled={isLoading}
              className="refresh-button"
            >
              <RefreshCw size={18} className={isLoading ? 'spinning' : ''} />
            </button>
          </div>

          {isLoading ? (
            <div className="status-loading">
              <Loader size={24} className="spinning" />
              <p>Checking API connection...</p>
            </div>
          ) : error ? (
            <div className="status-error">
              <XCircle size={24} />
              <div>
                <h3>Connection Failed</h3>
                <p>{error}</p>
                <div className="error-help">
                  <strong>To fix this:</strong>
                  <ol>
                    <li>Make sure MongoDB is connected</li>
                    <li>Start the backend server: <code>npm run dev</code></li>
                    <li>Ensure server is running on port 4000</li>
                  </ol>
                </div>
              </div>
            </div>
          ) : healthData ? (
            <div className="status-success">
              <CheckCircle size={24} />
              <div>
                <h3>API Connected</h3>
                <p>{healthData.message}</p>
                <div className="status-details">
                  <span>Version: {healthData.version}</span>
                  <span>Last Check: {new Date(healthData.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Features */}
      <div className="features-section">
        <h2>Backend Features</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <div className={`feature-status ${feature.status}`}>
                <CheckCircle size={16} />
                Ready to Test
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API Endpoints Overview */}
      <div className="endpoints-section">
        <h2>Available Endpoints</h2>
        <div className="endpoints-grid">
          <div className="endpoint-group">
            <h3>Authentication</h3>
            <ul>
              <li><code>POST /api/v1/users/register</code></li>
              <li><code>POST /api/v1/users/login</code></li>
              <li><code>POST /api/v1/users/logout</code></li>
              <li><code>GET /api/v1/users/me</code></li>
              <li><code>POST /api/v1/users/refresh-token</code></li>
            </ul>
          </div>
          
          <div className="endpoint-group">
            <h3>Notebooks</h3>
            <ul>
              <li><code>GET /api/v1/notebooks</code></li>
              <li><code>POST /api/v1/notebooks</code></li>
              <li><code>GET /api/v1/notebooks/:id</code></li>
              <li><code>PATCH /api/v1/notebooks/:id</code></li>
              <li><code>DELETE /api/v1/notebooks/:id</code></li>
            </ul>
          </div>

          <div className="endpoint-group">
            <h3>Documents</h3>
            <ul>
              <li><code>POST /api/v1/documents/upload</code></li>
              <li><code>GET /api/v1/documents/:id</code></li>
              <li><code>POST /api/v1/documents/search</code></li>
              <li><code>DELETE /api/v1/documents/:id</code></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Start Guide */}
      <div className="quickstart-section">
        <h2>Quick Start Guide</h2>
        <div className="quickstart-steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Test API Health</h3>
              <p>Check if the backend server is running and accessible</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Register Account</h3>
              <p>Create a new account to test the authentication system</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Login & Explore</h3>
              <p>Sign in and access the protected dashboard</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Test Features</h3>
              <p>Update profile, view stats, and test JWT functionality</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;