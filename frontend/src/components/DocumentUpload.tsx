import React, { useState, useRef } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle } from 'lucide-react';

interface UploadedFile {
  id?: string;
  filename: string;
  size: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
}

interface DocumentUploadProps {
  onUploadComplete?: (files: UploadedFile[]) => void;
  notebookId?: string;
  maxFiles?: number;
  maxFileSize?: number;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUploadComplete,
  notebookId,
  maxFiles = 10,
  maxFileSize = 50 * 1024 * 1024 // 50MB
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return 'Unsupported file type. Please upload PDF, DOCX, TXT, CSV, or XLSX files.';
    }
    if (file.size > maxFileSize) {
      return `File too large. Maximum size is ${formatFileSize(maxFileSize)}.`;
    }
    return null;
  };

  const handleFileSelect = (selectedFiles: FileList) => {
    const newFiles: UploadedFile[] = [];
    
    Array.from(selectedFiles).forEach(file => {
      const error = validateFile(file);
      if (error) {
        newFiles.push({
          filename: file.name,
          size: file.size,
          status: 'failed',
          error
        });
      } else {
        newFiles.push({
          filename: file.name,
          size: file.size,
          status: 'uploading'
        });
      }
    });

    if (files.length + newFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setFiles(prev => [...prev, ...newFiles]);
    uploadFiles(Array.from(selectedFiles).filter(file => !validateFile(file)));
  };

  const uploadFiles = async (filesToUpload: File[]) => {
    if (filesToUpload.length === 0) return;

    setUploading(true);
    
    try {
      const formData = new FormData();
      
      filesToUpload.forEach(file => {
        formData.append('documents', file);
      });
      
      if (notebookId) {
        formData.append('notebookId', notebookId);
      }

      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/v1/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        // Update file statuses based on response
        setFiles(prev => prev.map(file => {
          const uploadedFile = result.data.processedFiles.find(
            (pf: any) => pf.filename === file.filename
          );
          
          if (uploadedFile) {
            return {
              ...file,
              id: uploadedFile.id,
              status: uploadedFile.status === 'processing' ? 'processing' : 'completed',
              error: uploadedFile.error
            };
          }
          return file;
        }));

        onUploadComplete?.(result.data.processedFiles);
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setFiles(prev => prev.map(file => 
        file.status === 'uploading' 
          ? { ...file, status: 'failed' as const, error: 'Upload failed' }
          : file
      ));
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      case 'processing':
        return <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDrag}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Drop files here or click to browse
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Supports PDF, DOCX, TXT, CSV, XLSX files up to {formatFileSize(maxFileSize)}
        </p>
        <button
          type="button"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Select Files'}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.doc,.txt,.csv,.xls,.xlsx"
        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Uploaded Files ({files.length})
          </h4>
          <div className="space-y-3">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {file.filename}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                    {file.error && (
                      <p className="text-xs text-red-600 mt-1">{file.error}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {getStatusIcon(file.status)}
                  <span className="text-xs text-gray-500 capitalize">
                    {file.status}
                  </span>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-blue-800">Uploading and processing files...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;