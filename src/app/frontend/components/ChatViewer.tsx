'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, Search, MessageSquare, User, Bot, Trash2, Save } from 'lucide-react';
import { apiService, handleApiError, AnalysisResponse, RerankDemo, UploadResponse } from '../lib/api';
import { toast, Toaster } from 'sonner';
import { useAuth } from '@/lib/context/AuthContext';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  query?: string;
  sourceCount?: number;
  analysis?: AnalysisResponse;
  rerankData?: RerankDemo;
}

interface ChatSession {
  id: string;
  title?: string;
  userId: string;
  documentId: string;
  isSaved: boolean;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
}

interface CombinedComponentProps {
  isSystemReady: boolean;
  onUploadSuccess: (response: UploadResponse) => void;
}

export default function ChatViewer({ isSystemReady, onUploadSuccess }: CombinedComponentProps) {
  const { isAuthenticated, user } = useAuth();
  
  // Upload states
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [currentDocument, setCurrentDocument] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Query states
  const [query, setQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [presetQueries, setPresetQueries] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>('');
  const [showPresets, setShowPresets] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load preset queries and chat session on component mount
  useEffect(() => {
    if (isSystemReady) {
      loadPresetQueries();
      loadCurrentDocument();
    }
  }, [isSystemReady, user]);

  // Load or create session when document changes
  useEffect(() => {
    if (currentDocument && user) {
      loadOrCreateSession();
    }
  }, [currentDocument, user]);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // Auto-save session when messages change
  useEffect(() => {
    if (chatHistory.length > 0 && currentSessionId && user) {
      // Debounce the save to avoid too many API calls
      const timeoutId = setTimeout(() => {
        saveSessionToDatabase();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [chatHistory, currentSessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadCurrentDocument = async () => {
    try {
      if (isAuthenticated && user) {
        // For authenticated users, try to load from database first
        const response = await fetch(`/backend/api/documents?userId=${user.id}`, {
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          const documents = await response.json();
          if (documents.length > 0) {
            // Get the most recent document
            const mostRecent = documents[0];
            const documentInfo = {
              id: mostRecent.id,
              filename: mostRecent.filename,
              originalName: mostRecent.originalName,
              size: mostRecent.size,
              uploadedAt: mostRecent.createdAt,
              pages: mostRecent.pages,
              status: 'ready' as const,
              databaseId: mostRecent.id
            };
            setCurrentDocument(documentInfo);
            return;
          }
        }
      }
      
      // Fallback to localStorage for non-authenticated users or if database fails
      const storageKey = isAuthenticated && user?.id ? `uploaded_documents_${user.id}` : 'uploaded_documents';
      const savedDocs = localStorage.getItem(storageKey);
      if (savedDocs) {
        const docs = JSON.parse(savedDocs);
        if (docs.length > 0) {
          // Get the most recent document
          const sortedDocs = docs.sort((a: any, b: any) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
          setCurrentDocument(sortedDocs[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load current document:', error);
    }
  };

  // Helper function to get auth headers
  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('legalynx_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  };

  const loadOrCreateSession = async () => {
    if (!user || !currentDocument) return;

    try {
      // Try to find existing session for this user and document
      const response = await fetch(
        `/backend/api/chat-sessions/find?userId=${user.id}&documentId=${currentDocument.id}`,
        { headers: getAuthHeaders() }
      );
      
      if (response.ok) {
        const session = await response.json();
        setCurrentSessionId(session.id);
        
        // Load messages for this session
        const messagesResponse = await fetch(
          `/backend/api/chat-messages?sessionId=${session.id}`,
          { headers: getAuthHeaders() }
        );
        if (messagesResponse.ok) {
          const messages = await messagesResponse.json();
          const formattedMessages = messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setChatHistory(formattedMessages);
        }
      } else {
        // Create new session
        await createNewSession();
      }
    } catch (error) {
      console.error('Failed to load or create session:', error);
      // Fallback to creating new session
      await createNewSession();
    }
  };

  const createNewSession = async () => {
    if (!user || !currentDocument) return;

    try {
      const response = await fetch('/backend/api/chat-sessions', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userId: user.id,
          documentId: currentDocument.id,
          title: `Chat with ${currentDocument.originalName}`,
          isSaved: false
        })
      });

      if (response.ok) {
        const session = await response.json();
        setCurrentSessionId(session.id);
        setChatHistory([]);
        toast.success('New chat session created');
      }
    } catch (error) {
      console.error('Failed to create session:', error);
      toast.error('Failed to create chat session');
    }
  };

  const saveSessionToDatabase = async () => {
    if (!currentSessionId || !user || chatHistory.length === 0) return;

    try {
      // Generate title from first user message if not set
      const firstUserMessage = chatHistory.find(m => m.type === 'user');
      const title = firstUserMessage 
        ? `${firstUserMessage.content.substring(0, 50)}${firstUserMessage.content.length > 50 ? '...' : ''}`
        : `Chat with ${currentDocument?.originalName || 'Document'}`;

      // Update session
      await fetch(`/backend/api/chat-sessions/${currentSessionId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title,
          updatedAt: new Date().toISOString()
        })
      });

      // Save messages - we'll send all messages to ensure consistency
      await fetch('/backend/api/chat-messages/bulk', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          sessionId: currentSessionId,
          messages: chatHistory.map(msg => ({
            id: msg.id,
            type: msg.type,
            content: msg.content,
            timestamp: msg.timestamp.toISOString(),
            query: msg.query,
            sourceCount: msg.sourceCount
          }))
        })
      });
    } catch (error) {
      console.error('Failed to save session to database:', error);
    }
  };

  // Upload functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setUploadStatus('idle');
      setStatusMessage('');
    } else {
      setFile(null);
      setUploadStatus('error');
      setStatusMessage('Please select a valid PDF file');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setUploadStatus('idle');
      setStatusMessage('');
    } else {
      setUploadStatus('error');
      setStatusMessage('Please drop a valid PDF file');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus('error');
      setStatusMessage('Please select a PDF file first');
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');
    setStatusMessage('');

    try {
      const response = await apiService.uploadPdf(file);
      
      // Save document info to user-specific localStorage
      const documentInfo = {
        id: Date.now().toString(),
        filename: response.filename,
        originalName: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        pages: response.pages_processed,
        status: 'ready' as const
      };
      
      const storageKey = isAuthenticated && user?.id ? `uploaded_documents_${user.id}` : 'uploaded_documents';
      const existingDocs = JSON.parse(localStorage.getItem(storageKey) || '[]');
      existingDocs.push(documentInfo);
      localStorage.setItem(storageKey, JSON.stringify(existingDocs));
      
      setCurrentDocument(documentInfo);
      setUploadStatus('success');
      setStatusMessage(`Successfully processed ${response.pages_processed} pages from ${response.filename}`);
      onUploadSuccess(response);
    } catch (error) {
      setUploadStatus('error');
      setStatusMessage(handleApiError(error));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveSession = async () => {
    if (!currentSessionId) {
      toast.error('No active session to save');
      return;
    }

    try {
      await fetch(`/backend/api/chat-sessions/${currentSessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSaved: true })
      });

      toast.success('Chat session saved successfully!');
    } catch (error) {
      console.error('Failed to save session:', error);
      toast.error('Failed to save session');
    }
  };

  const resetUpload = () => {
    setFile(null);
    setUploadStatus('idle');
    setStatusMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Query functions
  const loadPresetQueries = async () => {
    try {
      const data = await apiService.getPresetQueries();
      setPresetQueries(data.preset_queries);
    } catch (error) {
      console.error('Failed to load preset queries:', error);
    }
  };

  const clearChatHistory = async () => {
    if (!currentSessionId) return;

    if (!confirm('Are you sure you want to clear this chat session?')) {
      return;
    }

    try {
      // Delete all messages for this session
      await fetch(`/backend/api/chat-messages/session/${currentSessionId}`, {
        method: 'DELETE'
      });

      setChatHistory([]);
      toast.success('Chat history cleared');
    } catch (error) {
      console.error('Failed to clear chat history:', error);
      toast.error('Failed to clear chat history');
    }
  };

  const exportChatHistory = () => {
    const chatText = chatHistory.map(msg => {
      const timestamp = msg.timestamp.toLocaleString();
      const sender = msg.type === 'user' ? 'You' : 'Assistant';
      return `[${timestamp}] ${sender}: ${msg.content}`;
    }).join('\n\n');

    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_session_${currentSessionId}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const addMessage = async (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    // Add to local state immediately for UI responsiveness
    setChatHistory(prev => [...prev, newMessage]);

    // Save to database
    if (currentSessionId) {
      try {
        await fetch('/backend/api/chat-messages', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            id: newMessage.id,
            sessionId: currentSessionId,
            type: newMessage.type,
            content: newMessage.content,
            timestamp: newMessage.timestamp.toISOString(),
            query: newMessage.query,
            sourceCount: newMessage.sourceCount
          })
        });
      } catch (error) {
        console.error('Failed to save message to database:', error);
        // Message is still in local state, so chat continues to work
      }
    }
  };

  const handleQuery = async (queryText?: string) => {
    const currentQuery = queryText || query;
    
    if (!currentQuery.trim()) {
      setError('Please enter a query');
      return;
    }

    // Create session if we don't have one yet
    if (!currentSessionId && user && currentDocument) {
      await createNewSession();
    }

    // Add user message
    await addMessage({
      type: 'user',
      content: currentQuery,
      query: currentQuery
    });

    setIsQuerying(true);
    setError('');
    setQuery(''); // Clear input after sending
    setShowPresets(false);

    try {
      const result = await apiService.queryDocuments(currentQuery);
      
      // Add assistant response
      await addMessage({
        type: 'assistant',
        content: result.response,
        query: currentQuery,
        sourceCount: result.source_count
      });
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      
      // Add error message to chat
      await addMessage({
        type: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}`,
        query: currentQuery
      });
    } finally {
      setIsQuerying(false);
    }
  };

  const selectPresetQuery = (selectedQuery: string) => {
    setQuery(selectedQuery);
    setError('');
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleQuery();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="h-full flex flex-col">
      {/* Fixed Document Header - Always visible */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4">
        {isSystemReady && currentDocument ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900">{currentDocument.originalName}</h3>
                <p className="text-sm text-gray-600">
                  {currentDocument.pages} pages • {formatFileSize(currentDocument.size)} • 
                  Uploaded {new Date(currentDocument.uploadedAt).toLocaleDateString()}
                  {currentSessionId && (
                    <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
                      Session Active
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex space-x-1">
                {chatHistory.length > 0 && (
                  <>
                    <button 
                      onClick={exportChatHistory}
                      className="flex items-center cursor-pointer p-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Export
                    </button>
                    <button 
                      onClick={handleSaveSession}
                      className="flex items-center cursor-pointer p-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Save Session
                    </button>
                    <button
                      onClick={clearChatHistory}
                      className="flex items-center cursor-pointer p-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Clear
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>  
        ) : (
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Upload Document</h3>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!isSystemReady ? (
          /* Upload Section */
          <div className="flex-1 flex flex-col justify-center p-8 max-w-2xl mx-auto w-full">
            {/* Compact File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors mb-4 ${
                file
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400 bg-gray-50'
              }`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">{file.name}</span>
                    <span className="text-sm text-green-600">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    onClick={resetUpload}
                    className="text-sm text-red-600 hover:text-red-800 underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <div>
                    <span className="text-gray-600">
                      Drop PDF here or{' '}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        browse files
                      </button>
                    </span>
                    <p className="text-sm text-gray-500 mt-1">Supports PDF files up to 50MB</p>
                  </div>
                </div>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className={`w-full py-3 px-4 rounded-md font-medium transition-colors mb-4 ${
                !file || isUploading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isUploading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing PDF...
                </div>
              ) : (
                'Upload and Process PDF'
              )}
            </button>

            {/* Status Message */}
            {statusMessage && (
              <div
                className={`p-4 rounded-md flex items-start text-sm ${
                  uploadStatus === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {uploadStatus === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                )}
                <span>{statusMessage}</span>
              </div>
            )}
          </div>
        ) : (
          /* Chat Section */
          <>
            {/* Chat Messages Container - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <div className="max-w-6xl mx-auto space-y-4">
                {chatHistory.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    <MessageSquare className="mx-auto w-12 h-12 mb-4" />
                    <p className="text-lg font-medium">Start a conversation</p>
                    <p>Ask questions about your uploaded document.</p>
                  </div>
                ) : (
                  chatHistory.map((message) => (
                    <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-4 ${
                        message.type === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}>
                        <div className="flex items-center mb-2">
                          {message.type === 'user' ? (
                            <User className="w-4 h-4 mr-2" />
                          ) : (
                            <Bot className="w-4 h-4 mr-2" />
                          )}
                          <span className="text-sm opacity-75">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        
                        {/* Source count for assistant messages */}
                        {message.type === 'assistant' && message.sourceCount !== undefined && (
                          <div className="mt-2 text-xs opacity-75 border-t pt-2">
                            Sources used: {message.sourceCount}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {isQuerying && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-800 rounded-lg p-4 max-w-[80%] border border-gray-200">
                      <div className="flex items-center">
                        <Bot className="w-4 h-4 mr-2" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Fixed Input Area */}
            <div className="flex-shrink-0 bg-white border-t border-gray-200 p-6">
              {/* Preset Queries - Fixed */}
              {showPresets && Object.keys(presetQueries).length > 0 && chatHistory.length === 0 && (
                <div className="flex-shrink-0 pb-6">
                  <div className="flex gap-2 flex-wrap justify-start">
                    {Object.entries(presetQueries).map(([key, value]) => (
                      <button
                        key={key}
                        onClick={() => selectPresetQuery(value)}
                        className="text-left p-2 px-3 text-sm bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-full cursor-pointer transition-colors"
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  {error}
                </div>
              )}

              {/* Input Area */}
              <div className='flex gap-4 mx-auto w-full'>
                <div className="flex-1">
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask a question about the uploaded document..."
                    rows={2}
                    className="w-full px-3 py-2 h-2xl border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex items-center">
                  <button
                    onClick={() => handleQuery()}
                    disabled={isQuerying || !query.trim()}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed h-fit"
                  >
                    {isQuerying ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Search className="w-4 h-4 mr-2" />
                    )}
                    Ask
                  </button>
                </div>
              </div>

              <div className="mt-2 text-xs text-gray-500 text-center">
                Press Enter to send, Shift+Enter for new line
              </div>
            </div>
          </>
        )}
      </div>
      <Toaster />
    </div>
  );
}