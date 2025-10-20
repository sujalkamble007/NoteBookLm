import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Loader, 
  Bot, 
  User, 
  Globe, 
  Video, 
  FileText, 
  Brain,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Settings,
  Zap,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: {
    documents?: Array<{
      documentId: string;
      title: string;
      relevantText: string;
    }>;
    webSources?: Array<{
      type: string;
      title: string;
      url: string;
      relevance: string;
    }>;
    videoSources?: Array<{
      type: string;
      title: string;
      url: string;
      relevance: string;
    }>;
  };
  metadata?: {
    documentsUsed: number;
    chunksAnalyzed: number;
    hasEnhancedContext: boolean;
    contextTypes: {
      documents: boolean;
      realTimeSearch: boolean;
      videos: boolean;
    };
    ragEnhanced: boolean;
    responseTime?: number;
  };
  isStreaming?: boolean;
  feedback?: 'positive' | 'negative' | null;
}

interface ChatSettings {
  useEnhancedRAG: boolean;
  maxDocuments: number;
  includeWebSearch: boolean;
  includeVideos: boolean;
  temperature: number;
}

interface EnhancedChatProps {
  notebookId?: string;
  documentIds?: string[];
  onMessageSent?: (message: string) => void;
}

const EnhancedChat: React.FC<EnhancedChatProps> = ({
  notebookId,
  documentIds = [],
  onMessageSent
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>({
    useEnhancedRAG: true,
    maxDocuments: 10,
    includeWebSearch: true,
    includeVideos: true,
    temperature: 0.7
  });
  const [showSettings, setShowSettings] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateMessageId = () => Math.random().toString(36).substr(2, 9);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    onMessageSent?.(input.trim());

    const startTime = Date.now();

    // Create assistant message placeholder for streaming
    const assistantMessageId = generateMessageId();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };
    
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch('http://localhost:4000/api/v1/chat/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        credentials: 'include',
        body: JSON.stringify({
          question: input.trim(),
          notebookId,
          documentIds,
          useEnhancedRAG: settings.useEnhancedRAG
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const responseTime = Date.now() - startTime;

      // Update the assistant message with the full response
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? {
              ...msg,
              content: result.data.response,
              sources: result.data.sources,
              metadata: {
                ...result.data.metadata,
                responseTime
              },
              isStreaming: false
            }
          : msg
      ));

    } catch (error) {
      console.error('Chat error:', error);
      
      // Update with error message
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? {
              ...msg,
              content: 'Sorry, I encountered an error while processing your request. Please try again.',
              isStreaming: false
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const provideFeedback = (messageId: string, feedback: 'positive' | 'negative') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, feedback } : msg
    ));
    
    // Here you could also send feedback to the backend
    console.log(`Feedback for message ${messageId}: ${feedback}`);
  };

  const renderSourceCard = (source: any, type: 'document' | 'web' | 'video') => {
    const icons = {
      document: <FileText className="w-4 h-4" />,
      web: <Globe className="w-4 h-4" />,
      video: <Video className="w-4 h-4" />
    };

    const colors = {
      document: 'blue',
      web: 'green',
      video: 'red'
    };

    return (
      <div
        key={source.url || source.documentId}
        className={`p-3 border border-${colors[type]}-200 rounded-lg bg-${colors[type]}-50 hover:bg-${colors[type]}-100 transition-colors`}
      >
        <div className="flex items-start space-x-2">
          <div className={`p-1 bg-${colors[type]}-100 rounded text-${colors[type]}-600`}>
            {icons[type]}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-medium text-${colors[type]}-900 truncate`}>
              {source.title}
            </h4>
            {source.relevantText && (
              <p className={`text-xs text-${colors[type]}-700 mt-1 line-clamp-2`}>
                {source.relevantText}
              </p>
            )}
            {source.url && (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center space-x-1 text-xs text-${colors[type]}-600 hover:text-${colors[type]}-800 mt-2`}
              >
                <span>View source</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    
    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-3xl ${isUser ? 'order-2' : 'order-1'}`}>
          {/* Avatar */}
          <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isUser ? 'bg-blue-500' : 'bg-gray-700'
            }`}>
              {isUser ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>
          </div>

          {/* Message Content */}
          <div className={`px-4 py-3 rounded-2xl ${
            isUser 
              ? 'bg-blue-500 text-white' 
              : 'bg-white border border-gray-200'
          }`}>
            <div className="text-sm whitespace-pre-wrap">
              {message.content}
              {message.isStreaming && (
                <span className="inline-block w-2 h-4 bg-gray-400 ml-1 animate-pulse" />
              )}
            </div>

            {/* Metadata for assistant messages */}
            {!isUser && message.metadata && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  {message.metadata.ragEnhanced && (
                    <div className="flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-yellow-500" />
                      <span>RAG Enhanced</span>
                    </div>
                  )}
                  {message.metadata.contextTypes.realTimeSearch && (
                    <div className="flex items-center space-x-1">
                      <Globe className="w-3 h-3 text-green-500" />
                      <span>Web Search</span>
                    </div>
                  )}
                  {message.metadata.contextTypes.videos && (
                    <div className="flex items-center space-x-1">
                      <Video className="w-3 h-3 text-red-500" />
                      <span>Video Sources</span>
                    </div>
                  )}
                  {message.metadata.responseTime && (
                    <div className="flex items-center space-x-1">
                      <Zap className="w-3 h-3 text-blue-500" />
                      <span>{message.metadata.responseTime}ms</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sources */}
          {!isUser && message.sources && (
            <div className="mt-3 space-y-3">
              {/* Document Sources */}
              {message.sources.documents && message.sources.documents.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center space-x-1">
                    <FileText className="w-3 h-3" />
                    <span>Document Sources ({message.sources.documents.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {message.sources.documents.map(doc => renderSourceCard(doc, 'document'))}
                  </div>
                </div>
              )}

              {/* Web Sources */}
              {message.sources.webSources && message.sources.webSources.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center space-x-1">
                    <Globe className="w-3 h-3" />
                    <span>Web Sources ({message.sources.webSources.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {message.sources.webSources.map(source => renderSourceCard(source, 'web'))}
                  </div>
                </div>
              )}

              {/* Video Sources */}
              {message.sources.videoSources && message.sources.videoSources.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center space-x-1">
                    <Video className="w-3 h-3" />
                    <span>Video Sources ({message.sources.videoSources.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {message.sources.videoSources.map(source => renderSourceCard(source, 'video'))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {!isUser && !message.isStreaming && (
            <div className="flex items-center space-x-2 mt-3">
              <button
                onClick={() => copyToClipboard(message.content, message.id)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Copy response"
              >
                {copiedMessageId === message.id ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              
              <button
                onClick={() => provideFeedback(message.id, 'positive')}
                className={`p-1 transition-colors ${
                  message.feedback === 'positive' 
                    ? 'text-green-500' 
                    : 'text-gray-400 hover:text-green-500'
                }`}
                title="Good response"
              >
                <ThumbsUp className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => provideFeedback(message.id, 'negative')}
                className={`p-1 transition-colors ${
                  message.feedback === 'negative' 
                    ? 'text-red-500' 
                    : 'text-gray-400 hover:text-red-500'
                }`}
                title="Poor response"
              >
                <ThumbsDown className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Bot className="w-6 h-6 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-900">Enhanced AI Assistant</h2>
          {settings.useEnhancedRAG && (
            <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 rounded-full">
              <Sparkles className="w-3 h-3 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-700">RAG Enhanced</span>
            </div>
          )}
        </div>
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.useEnhancedRAG}
                onChange={(e) => setSettings(prev => ({ ...prev, useEnhancedRAG: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Enhanced RAG</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.includeWebSearch}
                onChange={(e) => setSettings(prev => ({ ...prev, includeWebSearch: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Web Search</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.includeVideos}
                onChange={(e) => setSettings(prev => ({ ...prev, includeVideos: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Video Sources</span>
            </label>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Temperature:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.temperature}
                onChange={(e) => setSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                className="w-16"
              />
              <span className="text-xs text-gray-500">{settings.temperature}</span>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Start a conversation
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Ask questions about your documents. I'll provide comprehensive answers using 
              RAG enhancement, real-time search, and video sources.
            </p>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex space-x-3">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask anything about your documents..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        
        {/* Status indicator */}
        {isLoading && (
          <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
            <Brain className="w-4 h-4 animate-pulse" />
            <span>Processing with enhanced RAG...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedChat;
