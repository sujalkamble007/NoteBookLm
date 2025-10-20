import React, { useState, useCallback, useRef } from 'react';
import { 
  Upload, 
  X,
  CheckCircle, 
  AlertCircle, 
  Loader, 
  FileText, 
  Database, 
  Sparkles,
  Globe,
  Video,
  Brain
} from 'lucide-react';

interface UploadFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  result?: any;
  error?: string;
  processingStage?: 'upload' | 'parsing' | 'ai-analysis' | 'rag-enhancement' | 'vectorization';
}

interface ProcessingStage {
  stage: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const PROCESSING_STAGES: ProcessingStage[] = [
  {
    stage: 'upload',
    title: 'Uploading to Cloud',
    description: 'Securely storing file in Cloudinary',
    icon: <Upload className="w-4 h-4" />,
    color: 'blue'
  },
  {
    stage: 'parsing',
    title: 'Intelligent Parsing',
    description: 'Extracting text and structured data',
    icon: <FileText className="w-4 h-4" />,
    color: 'purple'
  },
  {
    stage: 'ai-analysis',
    title: 'AI Analysis',
    description: 'Groq LLM analyzing content',
    icon: <Brain className="w-4 h-4" />,
    color: 'green'
  },
  {
    stage: 'rag-enhancement',
    title: 'RAG Enhancement',
    description: 'Real-time search + YouTube integration',
    icon: <Sparkles className="w-4 h-4" />,
    color: 'yellow'
  },
  {
    stage: 'vectorization',
    title: 'Vectorization',
    description: 'Creating semantic embeddings',
    icon: <Database className="w-4 h-4" />,
    color: 'indigo'
  }
];

interface DocumentUploadProps {
  notebookId: string;
  onUploadComplete?: (documents: any[]) => void;
  onUploadStart?: () => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  notebookId,
  onUploadComplete,
  onUploadStart
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/csv',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ];

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('csv') || fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    if (fileType.includes('text')) return '📄';
    return '📎';
  };

  const generateFileId = () => Math.random().toString(36).substr(2, 9);

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadFile[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      if (!supportedTypes.includes(file.type)) {
        alert(`${file.name} is not a supported file type`);
        continue;
      }

      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        alert(`${file.name} is too large. Maximum size is 50MB`);
        continue;
      }

      newFiles.push({
        id: generateFileId(),
        file,
        status: 'pending',
        progress: 0,
        processingStage: 'upload'
      });
    }

    setFiles(prev => [...prev, ...newFiles]);
    
    if (newFiles.length > 0) {
      onUploadStart?.();
      // Start uploading immediately
      newFiles.forEach(uploadFile);
    }
  }, [notebookId]);

  const uploadFile = async (uploadFile: UploadFile) => {
    const updateFile = (updates: Partial<UploadFile>) => {
      setFiles(prev => prev.map(f => f.id === uploadFile.id ? { ...f, ...updates } : f));
    };

    try {
      updateFile({ status: 'uploading', processingStage: 'upload' });

      // Ensure we have a notebook ID - create default if needed
      let actualNotebookId = notebookId;
      if (!actualNotebookId || actualNotebookId === 'default') {
        try {
          const notebookResponse = await fetch('http://localhost:4000/api/v1/notebooks', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            },
            credentials: 'include',
            body: JSON.stringify({
              title: 'My Documents',
              description: 'Default notebook for uploaded documents'
            })
          });
          
          if (notebookResponse.ok) {
            const notebookData = await notebookResponse.json();
            actualNotebookId = notebookData.data._id;
          } else {
            actualNotebookId = 'default'; // fallback
          }
        } catch (error) {
          console.error('Failed to create notebook:', error);
          actualNotebookId = 'default'; // fallback
        }
      }

      const formData = new FormData();
      formData.append('documents', uploadFile.file);
      formData.append('notebookId', actualNotebookId);

      // Check authentication - use auth context instead of localStorage check
      // Since we're using credentials: 'include', the backend will check httpOnly cookies
      // Don't check localStorage as OAuth tokens might be in cookies only

      // Upload with progress tracking
      const response = await fetch('http://localhost:4000/api/v1/documents/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          // Only add Authorization header if token exists in localStorage
          ...(localStorage.getItem('accessToken') && {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          })
        }
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      updateFile({ 
        progress: 100, 
        status: 'processing',
        result: result.data[0],
        processingStage: 'parsing'
      });

      // Start polling for processing status
      if (result.data[0]) {
        pollProcessingStatus(uploadFile.id, result.data[0]._id);
      }

    } catch (error) {
      updateFile({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Upload failed'
      });
    }
  };

  const pollProcessingStatus = async (fileId: string, documentId: string) => {
    const updateFile = (updates: Partial<UploadFile>) => {
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, ...updates } : f));
    };

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:4000/api/v1/documents/${documentId}/status`, {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });

        if (!response.ok) {
          clearInterval(pollInterval);
          updateFile({ status: 'error', error: 'Failed to check processing status' });
          return;
        }

        const statusData = await response.json();
        const { processingStatus, status, isComplete } = statusData.data;

        // Update processing stage based on backend status
        let currentStage: string = 'upload';
        if (processingStatus.textExtraction === 'processing') currentStage = 'parsing';
        else if (processingStatus.aiAnalysis === 'processing') currentStage = 'ai-analysis';
        else if (processingStatus.vectorization === 'processing') currentStage = 'vectorization';
        else if (processingStatus.textExtraction === 'completed' && 
                processingStatus.aiAnalysis === 'pending') currentStage = 'rag-enhancement';

        updateFile({ 
          processingStage: currentStage as any,
          progress: isComplete ? 100 : Math.min(95, 
            (Object.values(processingStatus).filter(s => s === 'completed').length / 4) * 100
          )
        });

        if (isComplete) {
          clearInterval(pollInterval);
          updateFile({ 
            status: 'completed',
            progress: 100,
            processingStage: 'vectorization'
          });

          // Check if all files are completed
          setFiles(prev => {
            const allCompleted = prev.every(f => 
              f.id === fileId ? true : f.status === 'completed' || f.status === 'error'
            );
            
            if (allCompleted) {
              const completedDocs = prev
                .filter(f => f.status === 'completed' && f.result)
                .map(f => f.result);
              
              if (completedDocs.length > 0) {
                onUploadComplete?.(completedDocs);
              }
            }
            
            return prev;
          });
        }

        if (status === 'error') {
          clearInterval(pollInterval);
          updateFile({ status: 'error', error: 'Processing failed on server' });
        }

      } catch (error) {
        clearInterval(pollInterval);
        updateFile({ status: 'error', error: 'Failed to check processing status' });
      }
    }, 2000); // Poll every 2 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 300000);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const renderProcessingStages = (file: UploadFile) => {
    const currentStageIndex = PROCESSING_STAGES.findIndex(s => s.stage === file.processingStage);
    
    return (
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Processing Progress</span>
          <span>{Math.round(file.progress)}%</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {PROCESSING_STAGES.map((stage, index) => {
            const isActive = index === currentStageIndex;
            const isCompleted = index < currentStageIndex;

            return (
              <div
                key={stage.stage}
                className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-all duration-300 ${
                  isActive
                    ? `bg-${stage.color}-100 text-${stage.color}-700 border border-${stage.color}-200`
                    : isCompleted
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {isActive ? (
                  <Loader className="w-3 h-3 animate-spin" />
                ) : isCompleted ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  stage.icon
                )}
                <span className="hidden md:inline">{stage.title}</span>
              </div>
            );
          })}
        </div>

        {file.processingStage && (
          <div className="text-xs text-gray-600">
            {PROCESSING_STAGES.find(s => s.stage === file.processingStage)?.description}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 cursor-pointer ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.csv,.txt,.xlsx,.xls"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Upload Your Documents
        </h3>
        <p className="text-gray-600 mb-4">
          Drag and drop files here, or click to browse
        </p>
        
        <div className="text-sm text-gray-500">
          <p>Supported formats: PDF, DOCX, CSV, TXT, XLSX</p>
          <p>Maximum file size: 50MB</p>
        </div>

        {/* Processing Features */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex flex-col items-center space-y-1">
            <Globe className="w-5 h-5 text-blue-500" />
            <span className="text-gray-600">Real-time Search</span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <Video className="w-5 h-5 text-red-500" />
            <span className="text-gray-600">YouTube Integration</span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <Brain className="w-5 h-5 text-purple-500" />
            <span className="text-gray-600">AI Analysis</span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <span className="text-gray-600">RAG Enhanced</span>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6 space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">Processing Files</h4>
          
          {files.map((file) => (
            <div
              key={file.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="text-2xl">
                    {getFileIcon(file.file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-gray-900 truncate">
                      {file.file.name}
                    </h5>
                    <p className="text-xs text-gray-500">
                      {(file.file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                </div>

                {/* Status Icon */}
                <div className="flex items-center space-x-2">
                  {file.status === 'pending' && <Loader className="w-4 h-4 text-gray-400" />}
                  {file.status === 'uploading' && <Loader className="w-4 h-4 text-blue-500 animate-spin" />}
                  {file.status === 'processing' && <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />}
                  {file.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {file.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                  
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              {(file.status === 'uploading' || file.status === 'processing') && (
                <div className="mt-3">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        file.status === 'uploading' ? 'bg-blue-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Processing Stages */}
              {file.status === 'processing' && renderProcessingStages(file)}

              {/* Error Message */}
              {file.status === 'error' && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{file.error}</p>
                </div>
              )}

              {/* Success Message */}
              {file.status === 'completed' && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    ✨ Document processed successfully with RAG enhancement!
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
