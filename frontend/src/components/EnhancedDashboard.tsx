import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';
import type { UserStats } from '../types/auth';
import DocumentUpload from './DocumentUpload';
import EnhancedChat from './EnhancedChat';
import StreamingChat from './StreamingChat';
import {
  User,
  Mail,
  Calendar,
  CreditCard,
  BookOpen,
  FileText,
  Settings,
  LogOut,
  Edit,
  Save,
  X,
  Activity,
  Shield,
  Clock,
  Upload,
  MessageSquare,
  Zap,
  Brain,
  Grid,
  List
} from 'lucide-react';

type TabType = 'overview' | 'upload' | 'chat' | 'streaming' | 'profile';

const EnhancedDashboard: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userStats = await authService.getUserStats();
        setStats(userStats);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile(editForm);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: Activity },
    { id: 'upload' as TabType, label: 'Upload Documents', icon: Upload },
    { id: 'chat' as TabType, label: 'Enhanced Chat', icon: MessageSquare },
    { id: 'streaming' as TabType, label: 'Streaming Chat', icon: Zap },
    { id: 'profile' as TabType, label: 'Profile', icon: User },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}!</h1>
                  <p className="text-blue-100 text-lg">Ready to explore your knowledge base with AI?</p>
                </div>
                <div className="hidden md:block">
                  <Brain className="w-16 h-16 text-blue-200" />
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <BookOpen className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{stats?.totalNotebooks || user.totalNotebooks}</h3>
                    <p className="text-gray-600 font-medium">Notebooks</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-50 rounded-xl">
                    <FileText className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{stats?.totalDocuments || user.totalDocuments}</h3>
                    <p className="text-gray-600 font-medium">Documents</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-50 rounded-xl">
                    <MessageSquare className="w-8 h-8 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">42</h3>
                    <p className="text-gray-600 font-medium">AI Chats</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-50 rounded-xl">
                    <Zap className="w-8 h-8 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-green-600">Active</h3>
                    <p className="text-gray-600 font-medium">Status</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('upload')}
                  className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
                >
                  <Upload className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Upload Documents</h3>
                    <p className="text-sm text-gray-600">Add new materials to analyze</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('chat')}
                  className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left"
                >
                  <MessageSquare className="w-6 h-6 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Enhanced Chat</h3>
                    <p className="text-sm text-gray-600">Chat with RAG enhancement</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('streaming')}
                  className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left"
                >
                  <Zap className="w-6 h-6 text-purple-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Streaming Chat</h3>
                    <p className="text-sm text-gray-600">Real-time AI processing</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-center py-12 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No recent activity yet. Start by uploading documents or chatting with AI!</p>
              </div>
            </div>
          </div>
        );

      case 'upload':
        return (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Upload Documents</h2>
              <p className="text-gray-600 mt-2">Upload your materials for AI-powered analysis and chat</p>
            </div>
            <div className="p-6">
              <DocumentUpload notebookId="default" />
            </div>
          </div>
        );

      case 'chat':
        return (
          <div className="bg-white rounded-xl border border-gray-200 h-[800px]">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Enhanced AI Chat</h2>
              <p className="text-gray-600 mt-2">Chat with RAG enhancement, web search, and video sources</p>
            </div>
            <div className="h-[700px]">
              <EnhancedChat notebookId="default" />
            </div>
          </div>
        );

      case 'streaming':
        return (
          <div className="bg-white rounded-xl border border-gray-200 h-[800px]">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Streaming AI Chat</h2>
              <p className="text-gray-600 mt-2">Real-time AI responses with agent visualization</p>
            </div>
            <div className="h-[700px]">
              <StreamingChat notebookId="default" />
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-8">
            {/* Profile Section */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-6">
                  <div className="flex-shrink-0 w-5 h-5 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                  <div className="text-red-700 text-sm">{error}</div>
                </div>
              )}
              
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 mb-6">
                  <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="text-green-700 text-sm">{success}</div>
                </div>
              )}

              {isEditing ? (
                <form onSubmit={handleEditSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="editName" className="block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="editName"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        className="input-field"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="editEmail" className="block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="editEmail"
                        value={editForm.email}
                        onChange={(e) =>
                          setEditForm({ ...editForm, email: e.target.value })
                        }
                        className="input-field"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      type="submit" 
                      disabled={isLoading} 
                      className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setEditForm({ name: user.name, email: user.email });
                        setError('');
                        setSuccess('');
                      }}
                      className="flex items-center gap-2 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                        <p className="text-lg font-semibold text-gray-900">{user.name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Mail className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                        <p className="text-lg font-semibold text-gray-900">{user.email}</p>
                        {!user.isEmailVerified && (
                          <span className="inline-block mt-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            Not Verified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CreditCard className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Current Plan</label>
                        <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
                          user.plan === 'premium' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : user.plan === 'enterprise'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Calendar className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Member Since</label>
                        <p className="text-lg font-semibold text-gray-900">{formatDate(user.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Account Details */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Details</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Shield className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className="text-gray-700 font-medium">
                    Email Verification: {user.isEmailVerified ? (
                      <span className="text-green-600 font-semibold">Verified</span>
                    ) : (
                      <span className="text-yellow-600 font-semibold">Pending</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <Clock className="w-5 h-5 text-pink-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Last Updated: {formatDate(user.updatedAt)}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <Settings className="w-5 h-5 text-teal-600" />
                  </div>
                  <span className="text-gray-700 font-medium">User ID: <code className="bg-gray-200 px-2 py-1 rounded text-sm">{user._id}</code></span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Knowledge Assistant</h1>
                <p className="text-gray-600">Enhanced document processing & intelligent chat</p>
              </div>
            </div>
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default EnhancedDashboard;