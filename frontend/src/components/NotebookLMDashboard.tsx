import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Upload, 
  MessageSquare, 
  FileText, 
  Plus,
  Search,
  Filter,
  MoreVertical,
  Users,
  Calendar,
  TrendingUp
} from 'lucide-react';
import DocumentUpload from './DocumentUpload';
import ChatComponent from './ChatComponent';

interface Notebook {
  _id: string;
  title: string;
  description: string;
  documentCount: number;
  collaboratorCount: number;
  createdAt: string;
  statistics: {
    lastActivity: string;
    totalDocuments: number;
    viewCount: number;
  };
  owner: {
    name: string;
    email: string;
  };
}

interface Document {
  _id: string;
  title: string;
  originalFilename: string;
  fileType: string;
  fileSize: number;
  status: 'processing' | 'completed' | 'failed';
  summary: string;
  keyInsights: string[];
  createdAt: string;
}

const NotebookLMDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'notebooks' | 'documents' | 'upload' | 'chat'>('notebooks');
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedNotebook, setSelectedNotebook] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadNotebooks();
    loadDocuments();
  }, []);

  const loadNotebooks = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/v1/notebooks?page=1&limit=20', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setNotebooks(result.data.notebooks);
      }
    } catch (error) {
      console.error('Failed to load notebooks:', error);
    }
  };

  const loadDocuments = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/v1/documents?page=1&limit=20', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setDocuments(result.data.documents);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNotebook = async (title: string, description: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/v1/notebooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, description })
      });

      if (response.ok) {
        const result = await response.json();
        setNotebooks(prev => [result.data, ...prev]);
        return result.data;
      }
    } catch (error) {
      console.error('Failed to create notebook:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeColor = (fileType: string) => {
    const colors = {
      pdf: 'bg-red-100 text-red-800',
      docx: 'bg-blue-100 text-blue-800',
      txt: 'bg-gray-100 text-gray-800',
      csv: 'bg-green-100 text-green-800',
      xlsx: 'bg-emerald-100 text-emerald-800'
    };
    return colors[fileType as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const filteredNotebooks = notebooks.filter(notebook =>
    notebook.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notebook.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDocuments = documents.filter(document =>
    document.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    document.originalFilename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">NotebookLM Clone</h1>
                <p className="text-gray-500">AI-powered document analysis and Q&A</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search notebooks and documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { key: 'notebooks', label: 'Notebooks', icon: BookOpen },
              { key: 'documents', label: 'Documents', icon: FileText },
              { key: 'upload', label: 'Upload', icon: Upload },
              { key: 'chat', label: 'Chat', icon: MessageSquare }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`
                  flex items-center space-x-2 px-1 py-4 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === key 
                    ? 'text-blue-600 border-blue-600' 
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'notebooks' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Your Notebooks</h2>
              <button
                onClick={() => {
                  const title = prompt('Notebook title:');
                  const description = prompt('Description (optional):');
                  if (title) {
                    createNotebook(title, description || '');
                  }
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Notebook</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNotebooks.map((notebook) => (
                <div
                  key={notebook._id}
                  className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedNotebook(notebook._id);
                    setActiveTab('chat');
                  }}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-medium text-gray-900 line-clamp-1">
                        {notebook.title}
                      </h3>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {notebook.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {notebook.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <FileText className="w-3 h-3" />
                          <span>{notebook.statistics.totalDocuments} docs</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{notebook.collaboratorCount} collaborators</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(notebook.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        by {notebook.owner.name}
                      </span>
                      {notebook.statistics.viewCount > 0 && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <TrendingUp className="w-3 h-3" />
                          <span>{notebook.statistics.viewCount} views</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredNotebooks.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-4">No notebooks found</p>
                <button
                  onClick={() => {
                    const title = prompt('Notebook title:');
                    const description = prompt('Description (optional):');
                    if (title) {
                      createNotebook(title, description || '');
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create your first notebook
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Your Documents</h2>
              <div className="flex items-center space-x-2">
                <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {filteredDocuments.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {filteredDocuments.map((document) => (
                    <div key={document._id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {document.title}
                              </h3>
                              <p className="text-sm text-gray-500 truncate">
                                {document.originalFilename} • {formatFileSize(document.fileSize)}
                              </p>
                            </div>
                          </div>
                          
                          {document.summary && (
                            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                              {document.summary}
                            </p>
                          )}

                          {document.keyInsights.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {document.keyInsights.slice(0, 3).map((insight, index) => (
                                <span
                                  key={index}
                                  className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                                >
                                  {insight.substring(0, 30)}...
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex-shrink-0 ml-4">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${getFileTypeColor(document.fileType)}`}>
                              {document.fileType.toUpperCase()}
                            </span>
                            <span className={`
                              px-2 py-1 text-xs rounded-full
                              ${document.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                              ${document.status === 'processing' ? 'bg-yellow-100 text-yellow-800' : ''}
                              ${document.status === 'failed' ? 'bg-red-100 text-red-800' : ''}
                            `}>
                              {document.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(document.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-4">No documents found</p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Upload your first document
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Upload Documents</h2>
              <p className="text-gray-600">
                Upload your documents to start asking questions and getting AI-powered insights.
              </p>
            </div>

            <DocumentUpload
              notebookId={selectedNotebook || undefined}
              onUploadComplete={(files) => {
                console.log('Files uploaded:', files);
                loadDocuments(); // Refresh documents list
                setActiveTab('documents');
              }}
            />
          </div>
        )}

        {activeTab === 'chat' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Document Q&A</h2>
              <p className="text-gray-600">
                Ask questions about your documents and get AI-powered answers with source references.
              </p>
              {selectedNotebook && (
                <div className="mt-2">
                  <span className="inline-block px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                    Context: Selected Notebook
                  </span>
                </div>
              )}
            </div>

            <div className="h-[600px]">
              <ChatComponent 
                notebookId={selectedNotebook || undefined}
                onNewMessage={(message) => {
                  console.log('New message:', message);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotebookLMDashboard;