'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, Search, MessageSquare, Bot, Save, Plus } from 'lucide-react';
import { apiService, handleApiError, AnalysisResponse, RerankDemo, UploadResponse } from '../lib/api';
import { toast, Toaster } from 'sonner';
import { useAuth } from '@/lib/context/AuthContext';
import { authUtils } from '@/lib/auth';
import { GoCopy, GoSync, GoThumbsdown, GoThumbsup } from 'react-icons/go';

interface ChatMessage {
  id: string;
  type: 'USER' | 'ASSISTANT';
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
    if (currentDocument && user && isAuthenticated) {
      loadOrCreateSession();
    }
  }, [currentDocument, user, isAuthenticated]);

  // Load chat history from database when component mounts or user changes
  useEffect(() => {
    if (user && isAuthenticated && currentDocument) {
      loadChatHistoryFromDatabase();
    }
  }, [user, isAuthenticated, currentDocument]);

  const loadChatHistoryFromDatabase = async () => {
    if (!user || !isAuthenticated || !currentDocument) return;

    try {
      // Get all sessions for this user and document
      const response = await fetch('/backend/api/chat', {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        const sessions = data.sessions || [];
        
        // Find the most recent session for this document
        const documentSessions = sessions.filter((session: any) => session.documentId === currentDocument.id);
        
        if (documentSessions.length > 0) {
          const mostRecentSession = documentSessions[0]; // Already sorted by updatedAt desc
          setCurrentSessionId(mostRecentSession.id);
          
          // Load messages for this session
          const messagesResponse = await fetch(
            `/backend/api/chat-messages?sessionId=${mostRecentSession.id}`,
            { headers: getAuthHeaders() }
          );
          
          if (messagesResponse.ok) {
            const messages = await messagesResponse.json();
            const formattedMessages = messages.map((msg: any) => ({
              id: msg.id,
              type: msg.role, // Map 'role' to 'type'
              content: msg.content,
              timestamp: new Date(msg.createdAt || msg.timestamp)
            }));
            setChatHistory(formattedMessages);
          }
        } else {
          // No existing session for this document - DON'T CREATE ONE YET
          setCurrentSessionId(null);
          setChatHistory([]);
        }
      }
    } catch (error) {
      console.error('Failed to load chat history from database:', error);
    }
  };

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
        const response = await fetch('/backend/api/documents', {
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.documents && data.documents.length > 0) {
            // Get the most recent document
            const mostRecent = data.documents[0];
            const documentInfo = {
              id: mostRecent.id,
              filename: mostRecent.filename,
              originalName: mostRecent.originalName,
              size: mostRecent.size,
              uploadedAt: mostRecent.uploadedAt,
              pages: mostRecent.pageCount,
              status: mostRecent.status, // Use actual database status
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
    const token = authUtils.getToken(); // Use authUtils instead of localStorage
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  };

  const loadOrCreateSession = async () => {
    // This is now handled by loadChatHistoryFromDatabase
    // Keeping this function for backwards compatibility but it doesn't do much
    return;
  };

  const createNewSession = async () => {
    if (!user || !currentDocument) return null;

    try {
      const response = await fetch('/backend/api/chat-sessions', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userId: user.id,
          documentId: currentDocument.id,
          title: `Chat with ${currentDocument.originalName}`,
          isSaved: true
        })
      });

      if (response.ok) {
        const session = await response.json();
        const sessionId = session.id || session.sessionId;
        setCurrentSessionId(sessionId);
        console.log('Created new session:', sessionId);
        return sessionId;
      } else {
        const errorData = await response.json();
        console.error('Failed to create session:', errorData);
        toast.error('Failed to create chat session');
      }
    } catch (error) {
      console.error('Failed to create session:', error);
      toast.error('Failed to create chat session');
    }
    return null;
  };

  const saveSessionToDatabase = async () => {
    if (!currentSessionId || !user || chatHistory.length === 0) return;

    try {
      // Generate title from first user message if not set
      const firstUserMessage = chatHistory.find(m => m.type === 'USER');
      const title = firstUserMessage 
        ? `${firstUserMessage.content.substring(0, 50)}${firstUserMessage.content.length > 50 ? '...' : ''}`
        : `Chat with ${currentDocument?.originalName || 'Document'}`;

      // Update session title
      await fetch(`/backend/api/chat-sessions/${currentSessionId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title,
          updatedAt: new Date().toISOString(),
          isSaved: true
        })
      });

      console.log('Session updated with title:', title);
    } catch (error) {
      console.error('Failed to save session to database:', error);
    }
  };

  // Database save function for documents
  const saveDocumentToDatabase = async (documentInfo: any) => {
    if (!isAuthenticated || !user || !file) {
      // For non-authenticated users, just save to localStorage
      const storageKey = 'uploaded_documents';
      const existingDocs = JSON.parse(localStorage.getItem(storageKey) || '[]');
      existingDocs.push(documentInfo);
      localStorage.setItem(storageKey, JSON.stringify(existingDocs));
      return documentInfo;
    }

    try {
      // Use the /backend/api/documents/upload endpoint with FormData
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/backend/api/documents/upload', {
        method: 'POST',
        headers: {
          // Don't set Content-Type for FormData, let browser set it
          'Authorization': authUtils.getToken() ? `Bearer ${authUtils.getToken()}` : ''
        },
        body: formData
      });

      if (response.ok) {
        const savedDocument = await response.json();
        
        // Also save to localStorage for immediate access
        const storageKey = `uploaded_documents_${user.id}`;
        const existingDocs = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const localDocInfo = {
          id: savedDocument.documentId || savedDocument.id,
          filename: savedDocument.filename,
          originalName: savedDocument.originalName,
          size: savedDocument.size,
          uploadedAt: savedDocument.uploadedAt,
          pages: savedDocument.pages_processed || 1,
          status: 'ready' as const,
          databaseId: savedDocument.documentId || savedDocument.id
        };
        existingDocs.push(localDocInfo);
        localStorage.setItem(storageKey, JSON.stringify(existingDocs));
        
        toast.success('Document uploaded and saved to your account!');
        return localDocInfo;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save document to database');
      }
    } catch (error) {
      console.error('Failed to save to database:', error);
      toast.error(`Upload succeeded but failed to save to database: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Fallback to localStorage
      const storageKey = isAuthenticated && user?.id 
        ? `uploaded_documents_${user.id}` 
        : 'uploaded_documents';
      const existingDocs = JSON.parse(localStorage.getItem(storageKey) || '[]');
      existingDocs.push(documentInfo);
      localStorage.setItem(storageKey, JSON.stringify(existingDocs));
      
      return documentInfo;
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
      // For authenticated users, upload directly to database
      if (isAuthenticated && user) {
        const savedDocumentInfo = await saveDocumentToDatabase(null);
        
        // Also upload to RAG system for processing
        const ragResponse = await apiService.uploadPdf(file);
        
        setCurrentDocument(savedDocumentInfo);
        setUploadStatus('success');
        setStatusMessage('Successfully processed document and saved to your account');
        
        onUploadSuccess({
          documentId: savedDocumentInfo.id,
          filename: savedDocumentInfo.filename,
          originalName: savedDocumentInfo.originalName,
          size: savedDocumentInfo.size,
          uploadedAt: savedDocumentInfo.uploadedAt,
          pages_processed: ragResponse.pages_processed
        });
      } else {
        // For non-authenticated users, use RAG system only
        const response = await apiService.uploadPdf(file);
        
        const documentInfo = {
          id: Date.now().toString(),
          filename: response.filename,
          originalName: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          pages: response.pages_processed,
          status: 'ready' as const
        };

        await saveDocumentToDatabase(documentInfo);
        
        setCurrentDocument(documentInfo);
        setUploadStatus('success');
        setStatusMessage(`Successfully processed ${response.pages_processed} pages from ${file.name}`);
        
        onUploadSuccess({
          documentId: documentInfo.id,
          filename: response.filename,
          originalName: file.name,
          size: file.size,
          uploadedAt: documentInfo.uploadedAt,
          pages_processed: response.pages_processed
        });
      }
      
      // Reset form
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('error');
      setStatusMessage(handleApiError(error));
      toast.error('Upload failed: ' + handleApiError(error));
    } finally {
      setIsUploading(false);
    }
  };

  // New Chat function - complete reset back to upload state
  const handleNewChat = async () => {
    if (chatHistory.length > 0 && !confirm('Are you sure you want to start a new chat? This will clear everything and return to upload.')) {
      return;
    }

    try {
      // Clear ALL state - complete reset
      setCurrentSessionId(null);
      setChatHistory([]);
      setCurrentDocument(null);
      setFile(null);
      setUploadStatus('idle');
      setStatusMessage('');
      setQuery('');
      setError('');
      setShowPresets(true);
      setIsUploading(false);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Trigger the parent component to reset system ready state
      // This will show the upload interface again
      onUploadSuccess({
        documentId: '',
        filename: '',
        originalName: '',
        size: 0,
        uploadedAt: '',
        pages_processed: 0
      });
      
      toast.success('Reset to upload - ready for new document');
    } catch (error) {
      console.error('Failed to reset:', error);
      toast.error('Failed to reset');
    }
  };
  const handleSaveFile = async () => {
    if (!currentDocument || !isAuthenticated || !user) {
      toast.error('No document to save or user not authenticated');
      return;
    }
  
    try {
      const response = await fetch('/backend/api/documents/save-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authUtils.getToken()}`,
        },
        body: JSON.stringify({
          documentId: currentDocument.id,
          title: currentDocument.title || 'Untitled',
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save document');
      }
  
      const savedDocumentInfo = await response.json();
      setCurrentDocument(savedDocumentInfo);
      toast.success('Document saved to your account!');
    } catch (error: any) {
      console.error('Failed to save file:', error);
      toast.error(error.message || 'Failed to save file to account');
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

  const addMessage = async (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    // Add to local state immediately for UI responsiveness
    setChatHistory(prev => [...prev, newMessage]);

    // Create session ONLY if this is the VERY FIRST message and we don't have one
    let sessionId = currentSessionId;
    if (!sessionId && user && currentDocument && chatHistory.length === 0) {
      console.log('Creating new session for first message');
      sessionId = await createNewSession();
      if (!sessionId) {
        console.error('Failed to create session, message will not be saved to database');
        return;
      }
    }

    // Save individual message to database
    if (sessionId) {
      try {
        console.log('Saving message to database:', newMessage.content.substring(0, 50));
        const response = await fetch('/backend/api/chat-messages', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            id: newMessage.id,
            sessionId: sessionId,
            role: newMessage.type.toUpperCase(), // USER or ASSISTANT
            content: newMessage.content,
            createdAt: newMessage.timestamp.toISOString(),
            tokensUsed: 0
          })
        });

        if (response.ok) {
          const savedMessage = await response.json();
          console.log('Message saved successfully:', savedMessage.messageId || savedMessage.id);
        } else {
          const errorData = await response.json();
          console.error('Failed to save message:', errorData);
        }
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

    // Add user message
    await addMessage({
      type: 'USER',
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
        type: 'ASSISTANT',
        content: result.response,
        query: currentQuery,
        sourceCount: result.source_count
      });
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      
      // Add error message to chat
      await addMessage({
        type: 'ASSISTANT',
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
        {currentDocument ? (
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
              <div className="flex space-x-2">
                {/* New Chat button - always visible when document is loaded */}
                <button 
                  onClick={handleNewChat}
                  className="flex items-center cursor-pointer p-2 px-3 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all duration-300"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  New Chat
                </button>
                  <button 
                    onClick={handleSaveFile}
                    className="flex items-center cursor-pointer p-2 px-3 text-sm bg-[#e4c858] text-white rounded-lg hover:brightness-105 transition-all duration-300"
                  >
                    Save File
                  </button>
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
        {!currentDocument ? (
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

            {/* Authentication Notice */}
            {!isAuthenticated && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
                <p className="font-medium">Session Only Mode</p>
                <p>Your document will be processed for this session only. <a href="/frontend/login" className="underline hover:text-yellow-900">Sign in</a> to save documents permanently.</p>
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
                    <div key={message.id} className={`flex ${message.type === 'USER' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-xl p-4 ${
                        message.type === 'USER' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}>
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        {message.type === 'ASSISTANT' && (
                          <div className="flex gap-3 text-xs opacity-50 mt-2">
                            <GoCopy className="w-4 h-4 cursor-pointer hover:text-blue-600" />
                            <GoThumbsup className="w-4 h-4 cursor-pointer hover:text-green-600" />
                            <GoThumbsdown className="w-4 h-4 cursor-pointer hover:text-red-600" />
                            <GoSync className="w-4 h-4 cursor-pointer hover:text-gray-900" />
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