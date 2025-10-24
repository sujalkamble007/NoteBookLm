import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader, FileText, ExternalLink } from 'lucide-react';

interface Source {
  documentId: string;
  title: string;
  filename: string;
  fileType: string;
  chunkIndex: number;
  similarity: number;
  textPreview: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Source[];
  confidence?: number;
}

interface ChatComponentProps {
  notebookId?: string;
  placeholder?: string;
  onNewMessage?: (message: ChatMessage) => void;
}

const ChatComponent: React.FC<ChatComponentProps> = ({
  notebookId,
  placeholder = "Ask a question about your documents...",
  onNewMessage
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/v1/documents/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question: userMessage.content,
          ...(notebookId && { notebookId }),
          limit: 5
        })
      });

      const result = await response.json();

      if (response.ok) {
        const assistantMessage: ChatMessage = {
          id: generateId(),
          type: 'assistant',
          content: result.data.answer,
          timestamp: new Date(),
          sources: result.data.sources,
          confidence: result.data.confidence
        };

        setMessages(prev => [...prev, assistantMessage]);
        onNewMessage?.(assistantMessage);
      } else {
        throw new Error(result.message || 'Failed to get response');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);
      
      const errorResponse: ChatMessage = {
        id: generateId(),
        type: 'assistant',
        content: `I apologize, but I encountered an error: ${errorMessage}. Please try again.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getFileTypeIcon = () => {
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Bot className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Document Q&A Assistant
          </h2>
          {notebookId && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              Notebook Context
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Bot className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Ask me anything about your documents</p>
            <p className="text-sm">I'll search through your uploaded files and provide detailed answers with sources.</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-[80%] rounded-lg px-4 py-3 
                ${message.type === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-900'
                }
              `}
            >
              <div className="flex items-start space-x-2">
                {message.type === 'assistant' && (
                  <Bot className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                )}
                {message.type === 'user' && (
                  <User className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                )}
                
                <div className="flex-1">
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
                  
                  {/* Confidence Score */}
                  {message.confidence !== undefined && (
                    <div className="mt-2 text-xs">
                      <span className="text-gray-600">Confidence: </span>
                      <span className={getConfidenceColor(message.confidence)}>
                        {message.confidence}%
                      </span>
                    </div>
                  )}
                  
                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-gray-600">Sources:</p>
                      {message.sources.map((source, index) => (
                        <div
                          key={index}
                          className="p-2 bg-white border border-gray-200 rounded text-xs"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              {getFileTypeIcon()}
                              <span className="font-medium text-gray-900 truncate">
                                {source.title}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">
                                {Math.round(source.similarity * 100)}% match
                              </span>
                              <ExternalLink className="w-3 h-3 text-gray-400" />
                            </div>
                          </div>
                          <p className="text-gray-600 line-clamp-2">
                            {source.textPreview}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs opacity-70 mt-2">
                    {formatTimestamp(message.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-3 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-blue-600" />
                <Loader className="w-4 h-4 text-gray-600 animate-spin" />
                <span className="text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200">
        <div className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              className="
                w-full px-4 py-3 border border-gray-300 rounded-lg resize-none
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                disabled:opacity-50 disabled:cursor-not-allowed
                min-h-[48px] max-h-[120px]
              "
              rows={1}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="
              flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-lg
              hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-200
            "
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;