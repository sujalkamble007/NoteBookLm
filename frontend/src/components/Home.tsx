import React, { useState, useEffect } from 'react';
import authService from '../services/authService';
import { 
  Server, 
  CheckCircle, 
  XCircle, 
  Loader, 
  Database, 
  ArrowRight,
  RefreshCw,
  BookOpen,
  Shield,
  Sparkles
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
      icon: <Shield className="w-6 h-6" />,
      title: 'Authentication System',
      description: 'JWT-based authentication with access and refresh tokens',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: 'File Processing',
      description: 'Upload and process PDF, DOCX, CSV, TXT, and Excel files',
      color: 'from-green-500 to-emerald-600'
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'AI Integration',
      description: 'Groq API for document analysis and content generation',
      color: 'from-purple-500 to-pink-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="relative px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 flex justify-center">
              <div className="rounded-full bg-white/10 p-4 backdrop-blur-sm border border-white/20">
                <BookOpen className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 animate-fade-in">
              NotebookLM
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent"> Clone</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto animate-slide-up">
              A powerful backend API for document processing, AI-powered analysis, 
              and collaborative notebooks with authentication testing interface.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a 
                href="/notebook" 
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <BookOpen className="w-5 h-5" />
                Try NotebookLM
                <ArrowRight className="w-5 h-5" />
              </a>
              <a 
                href="/login" 
                className="inline-flex items-center gap-2 bg-white text-primary-600 px-8 py-3 rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Login
                <ArrowRight className="w-5 h-5" />
              </a>
              <a 
                href="/register" 
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-3 rounded-full font-semibold hover:bg-white/20 transition-all duration-200"
              >
                Create Account
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* API Health Status */}
      <div className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-50 rounded-lg">
                  <Server className="w-6 h-6 text-primary-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">API Health Status</h2>
              </div>
              <button 
                onClick={checkAPIHealth} 
                disabled={isLoading}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {isLoading ? (
              <div className="flex items-center gap-3 text-gray-600">
                <Loader className="w-6 h-6 animate-spin" />
                <p className="text-lg">Checking API connection...</p>
              </div>
            ) : error ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-red-600">
                  <XCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold">Connection Failed</h3>
                    <p className="text-red-500">{error}</p>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="font-semibold text-red-800 mb-2">To fix this:</p>
                  <ol className="list-decimal list-inside space-y-1 text-red-700">
                    <li>Make sure MongoDB is connected</li>
                    <li>Start the backend server: <code className="bg-red-100 px-2 py-1 rounded text-sm">npm run dev</code></li>
                    <li>Ensure server is running on port 4000</li>
                  </ol>
                </div>
              </div>
            ) : healthData ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-green-600">
                  <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-700">API Connected</h3>
                    <p className="text-green-600">{healthData.message}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <span className="bg-gray-100 px-3 py-1 rounded-full">Version: {healthData.version}</span>
                  <span className="bg-gray-100 px-3 py-1 rounded-full">
                    Last Check: {new Date(healthData.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="px-4 py-16 sm:px-6 lg:px-8 bg-white">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Backend Features</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful features ready to test and integrate into your applications
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="p-8">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <div className="text-white">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Ready to Test
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* API Endpoints Overview */}
      <div className="px-4 py-16 sm:px-6 lg:px-8 bg-gray-50">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Available Endpoints</h2>
            <p className="text-lg text-gray-600">Comprehensive API endpoints for all your application needs</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Authentication</h3>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded text-blue-600">POST /api/v1/users/register</code>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded text-blue-600">POST /api/v1/users/login</code>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded text-blue-600">POST /api/v1/users/logout</code>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded text-blue-600">GET /api/v1/users/me</code>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded text-blue-600">POST /api/v1/users/refresh-token</code>
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Notebooks</h3>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded text-purple-600">GET /api/v1/notebooks</code>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded text-purple-600">POST /api/v1/notebooks</code>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded text-purple-600">GET /api/v1/notebooks/:id</code>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded text-purple-600">PATCH /api/v1/notebooks/:id</code>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded text-purple-600">DELETE /api/v1/notebooks/:id</code>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Database className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Documents</h3>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded text-green-600">POST /api/v1/documents/upload</code>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded text-green-600">GET /api/v1/documents/:id</code>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded text-green-600">POST /api/v1/documents/search</code>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded text-green-600">DELETE /api/v1/documents/:id</code>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Start Guide */}
      <div className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Quick Start Guide</h2>
            <p className="text-lg text-gray-600">Get started with the NotebookLM Clone in 4 simple steps</p>
          </div>
          <div className="space-y-6">
            <div className="flex items-center gap-6 p-6 bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Test API Health</h3>
                <p className="text-gray-600">Check if the backend server is running and accessible</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6 p-6 bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Register Account</h3>
                <p className="text-gray-600">Create a new account to test the authentication system</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6 p-6 bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Login & Explore</h3>
                <p className="text-gray-600">Sign in and access the protected dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6 p-6 bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                4
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Test Features</h3>
                <p className="text-gray-600">Update profile, view stats, and test JWT functionality</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;