import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Loader, 
  Bot, 
  User, 
  Brain,
  Sparkles,
  Zap,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  Play,
  Pause
} from 'lucide-react';

interface StreamingMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  stages?: {
    documentRetrieval: { status: 'pending' | 'processing' | 'completed'; progress: number };
    webSearch: { status: 'pending' | 'processing' | 'completed'; progress: number };
    videoSearch: { status: 'pending' | 'processing' | 'completed'; progress: number };
    ragProcessing: { status: 'pending' | 'processing' | 'completed'; progress: number };
    llmGeneration: { status: 'pending' | 'processing' | 'completed'; progress: number };
  };
  sources?: any;
  metadata?: any;
}

interface AgentStep {
  id: string;
  type: 'search' | 'analysis' | 'retrieval' | 'generation';
  status: 'pending' | 'processing' | 'completed' | 'error';
  title: string;
  description: string;
  startTime?: Date;
  endTime?: Date;
  progress: number;
  details?: string;
}

interface StreamingChatProps {
  notebookId?: string;
  documentIds?: string[];
  onMessageSent?: (message: string) => void;
}

const StreamingChat: React.FC<StreamingChatProps> = ({
  notebookId,
  documentIds = [],
  onMessageSent
}) => {
  const [messages, setMessages] = useState<StreamingMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentSteps, setCurrentSteps] = useState<AgentStep[]>([]);
  const [showAgentSteps, setShowAgentSteps] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentSteps]);

  const generateMessageId = () => Math.random().toString(36).substr(2, 9);

  // Simulate streaming steps
  const simulateStreamingSteps = async () => {
    const steps: AgentStep[] = [
      {
        id: '1',
        type: 'retrieval',
        status: 'pending',
        title: 'Document Retrieval',
        description: 'Searching through uploaded documents...',
        progress: 0
      },
      {
        id: '2',
        type: 'search',
        status: 'pending',
        title: 'Web Search',
        description: 'Finding relevant information online...',
        progress: 0
      },
      {
        id: '3',
        type: 'search',
        status: 'pending',
        title: 'Video Search',
        description: 'Looking for educational videos...',
        progress: 0
      },
      {
        id: '4',
        type: 'analysis',
        status: 'pending',
        title: 'RAG Processing',
        description: 'Analyzing and combining information...',
        progress: 0
      },
      {
        id: '5',
        type: 'generation',
        status: 'pending',
        title: 'Response Generation',
        description: 'Generating comprehensive answer...',
        progress: 0
      }
    ];

    setCurrentSteps(steps);

    // Process each step
    for (let i = 0; i < steps.length; i++) {
      if (abortControllerRef.current?.signal.aborted) break;

      const step = steps[i];
      
      // Start step
      setCurrentSteps(prev => prev.map(s => 
        s.id === step.id 
          ? { ...s, status: 'processing', startTime: new Date() }
          : s
      ));

      // Simulate progress
      for (let progress = 0; progress <= 100; progress += 10) {
        if (abortControllerRef.current?.signal.aborted) break;
        
        await new Promise(resolve => setTimeout(resolve, 150));
        
        setCurrentSteps(prev => prev.map(s => 
          s.id === step.id ? { ...s, progress } : s
        ));
      }

      // Complete step
      setCurrentSteps(prev => prev.map(s => 
        s.id === step.id 
          ? { ...s, status: 'completed', endTime: new Date(), progress: 100 }
          : s
      ));

      await new Promise(resolve => setTimeout(resolve, 300));
    }
  };

  const streamResponse = async (messageId: string, response: string) => {
    const words = response.split(' ');
    let currentContent = '';

    for (let i = 0; i < words.length; i++) {
      if (abortControllerRef.current?.signal.aborted) break;
      
      currentContent += (i > 0 ? ' ' : '') + words[i];
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: currentContent, isStreaming: i < words.length - 1 }
          : msg
      ));

      await new Promise(resolve => setTimeout(resolve, 50));
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: StreamingMessage = {
      id: generateMessageId(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);
    onMessageSent?.(input.trim());

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    // Create assistant message placeholder
    const assistantMessageId = generateMessageId();
    const assistantMessage: StreamingMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };
    
    setMessages(prev => [...prev, assistantMessage]);

    try {
      // Start streaming steps simulation
      const stepsPromise = simulateStreamingSteps();

      // Make API call
      const response = await fetch('http://localhost:4000/api/v1/chat/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        credentials: 'include',
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          question: input.trim(),
          notebookId,
          documentIds,
          useEnhancedRAG: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Wait for steps to complete
      await stepsPromise;

      // Stream the response
      await streamResponse(assistantMessageId, result.data.response);

      // Update with sources and metadata
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? {
              ...msg,
              sources: result.data.sources,
              metadata: result.data.metadata,
              isStreaming: false
            }
          : msg
      ));

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
      } else {
        console.error('Chat error:', error);
        
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? {
                ...msg,
                content: 'Sorry, I encountered an error while processing your request. Please try again.',
                isStreaming: false
              }
            : msg
        ));
      }
    } finally {
      setIsStreaming(false);
      setCurrentSteps([]);
      abortControllerRef.current = null;
    }
  };

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getStepIcon = (status: string) => {
    const iconClass = "w-4 h-4";
    
    if (status === 'completed') {
      return <CheckCircle className={`${iconClass} text-green-500`} />;
    } else if (status === 'processing') {
      return <Loader className={`${iconClass} text-blue-500 animate-spin`} />;
    } else if (status === 'error') {
      return <AlertCircle className={`${iconClass} text-red-500`} />;
    } else {
      return <Clock className={`${iconClass} text-gray-400`} />;
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'processing': return 'blue';
      case 'error': return 'red';
      default: return 'gray';
    }
  };

  const renderAgentSteps = () => {
    if (currentSteps.length === 0) return null;

    return (
      <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
            <Brain className="w-4 h-4 text-blue-500" />
            <span>AI Agent Processing</span>
          </h3>
          <button
            onClick={() => setShowAgentSteps(!showAgentSteps)}
            className="text-gray-400 hover:text-gray-600"
          >
            {showAgentSteps ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>

        {showAgentSteps && (
          <div className="space-y-3">
            {currentSteps.map((step) => (
              <div key={step.id} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {getStepIcon(step.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{step.title}</p>
                    <span className="text-xs text-gray-500">{step.progress}%</span>
                  </div>
                  <p className="text-xs text-gray-500">{step.description}</p>
                  
                  {/* Progress bar */}
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
                    <div
                      className={`h-1 rounded-full bg-${getStepColor(step.status)}-500 transition-all duration-300`}
                      style={{ width: `${step.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderMessage = (message: StreamingMessage) => {
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

            {/* Streaming indicators */}
            {!isUser && message.isStreaming && (
              <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
                <Sparkles className="w-3 h-3 animate-pulse text-yellow-500" />
                <span>Generating response...</span>
              </div>
            )}
          </div>
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
          <h2 className="text-lg font-semibold text-gray-900">Streaming AI Assistant</h2>
          <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 rounded-full">
            <Zap className="w-3 h-3 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">Real-time</span>
          </div>
        </div>
        
        {isStreaming && (
          <button
            onClick={stopStreaming}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Stop
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Real-time AI Assistant
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Experience real-time AI processing with visual feedback. Watch as I search, 
              analyze, and generate responses step by step.
            </p>
          </div>
        ) : (
          <>
            {messages.map(renderMessage)}
            {renderAgentSteps()}
          </>
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
              placeholder="Ask anything and watch the AI work in real-time..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              disabled={isStreaming}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isStreaming ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        
        {/* Real-time status */}
        {isStreaming && (
          <div className="mt-2 flex items-center space-x-2 text-sm text-blue-600">
            <Search className="w-4 h-4 animate-pulse" />
            <span>Processing with real-time feedback...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamingChat;