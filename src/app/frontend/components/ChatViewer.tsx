'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FileText, AlertCircle, Search, MessageSquare, Bot, Plus } from 'lucide-react';
import { apiService, handleApiError, AnalysisResponse, RerankDemo, UploadResponse } from '../lib/api';
import { toast, Toaster } from 'sonner';
import { useAuth } from '@/lib/context/AuthContext';
import { authUtils } from '@/lib/auth';
import { GoCopy, GoDownload, GoSync, GoThumbsdown, GoThumbsup } from 'react-icons/go';
import SaveDocumentModal from './SaveDocumentModal';
import UploadPage from './UploadPage';

interface ChatMessage {
  id: string;
  type: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: Date;
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
  selectedSessionId?: string;
  resetToUpload?: boolean; // ✅ Add this prop

}

export default function ChatViewer({ isSystemReady, onUploadSuccess, selectedSessionId, resetToUpload }: CombinedComponentProps) {
  const { isAuthenticated, user } = useAuth();
  
  // Document and session states
  const [currentDocument, setCurrentDocument] = useState<any>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  // Add isSaving state at the top with other states
  // Add isSaving state at the top with other states
  const [isSaving, setIsSaving] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // Chat states
  const [query, setQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [presetQueries, setPresetQueries] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>('');
  const [showPresets, setShowPresets] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (resetToUpload) {
      console.log('🔄 Resetting ChatViewer to upload state');
      handleNewChat();
    }
  }, [resetToUpload]);

  // Load current document and session on component mount
  useEffect(() => {
    if (isSystemReady) {
      loadCurrentDocument();
    }
  }, [isSystemReady, user]);

  // Handle selected session loading
  useEffect(() => {
    if (selectedSessionId && selectedSessionId !== currentSessionId) {
      loadSpecificSession(selectedSessionId);
    }
  }, [selectedSessionId]);

  // Load or create session when document changes
  useEffect(() => {
    if (currentDocument && user && !currentSessionId) {
      loadOrCreateSession();
    }
  }, [currentDocument, user, currentSessionId]);

  // Load chat history from database when component mounts or user changes
  useEffect(() => {
    if (user && isAuthenticated && currentDocument) {
      loadChatHistoryFromDatabase();
    }
  }, [user, isAuthenticated, currentDocument]);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // Auto-save session when messages change
  useEffect(() => {
    if (chatHistory.length > 0 && currentSessionId && user) {
      const timeoutId = setTimeout(() => {
        saveSessionToDatabase();
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [chatHistory, currentSessionId]);

  // Helper function to get auth headers
  const getAuthHeaders = (): HeadersInit => {
    const token = authUtils.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  };

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
              status: mostRecent.status,
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

  const loadSpecificSession = async (sessionId: string) => {
    if (!user || isLoadingSession) return;

    setIsLoadingSession(true);
    try {
      const response = await fetch(`/backend/api/chat/${sessionId}/messages`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const sessionData = await response.json();
        
        setCurrentSessionId(sessionData.sessionId);
        
        const documentInfo = {
          id: sessionData.document.id,
          originalName: sessionData.document.name,
          size: sessionData.document.size,
          pages: sessionData.document.pages,
          status: sessionData.document.status,
          uploadedAt: new Date().toISOString()
        };
        setCurrentDocument(documentInfo);
        
        const formattedMessages: ChatMessage[] = sessionData.messages.map((msg: any) => ({
          id: msg.id,
          type: msg.role,
          content: msg.content,
          createdAt: new Date(msg.createdAt),
          sourceCount: msg.tokensUsed
        }));
        
        setChatHistory(formattedMessages);
        setShowPresets(false);
      } else if (response.status === 401) {
        toast.error('Authentication failed. Please sign in again.');
      } else {
      }
    } catch (error) {
      console.error('Failed to load specific session:', error);
    } finally {
      setIsLoadingSession(false);
    }
  };

  const loadChatHistoryFromDatabase = async () => {
    if (!user || !isAuthenticated || !currentDocument) return;

    try {
      const response = await fetch('/backend/api/chat', {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        const sessions = data.sessions || [];
        
        const documentSessions = sessions.filter((session: any) => session.documentId === currentDocument.id);
        
        if (documentSessions.length > 0) {
          const mostRecentSession = documentSessions[0];
          setCurrentSessionId(mostRecentSession.id);
          
          const messagesResponse = await fetch(
            `/backend/api/chat-messages?sessionId=${mostRecentSession.id}`,
            { headers: getAuthHeaders() }
          );
          
          if (messagesResponse.ok) {
            const messages = await messagesResponse.json();
            const formattedMessages = messages.map((msg: any) => ({
              id: msg.id,
              type: msg.role,
              content: msg.content,
              createdAt: new Date(msg.createdAt || msg.timestamp)
            }));
            setChatHistory(formattedMessages);
          }
        } else {
          setCurrentSessionId(null);
          setChatHistory([]);
        }
      }
    } catch (error) {
      console.error('Failed to load chat history from database:', error);
    }
  };

  const loadOrCreateSession = async () => {
    if (!user || !currentDocument || isCreatingSession) return;
  
    try {
      setIsCreatingSession(true);
      const documentId = currentDocument.databaseId || currentDocument.id;
      
      const response = await fetch(
        `/backend/api/chat-sessions/find?userId=${user.id}&documentId=${documentId}`,
        { headers: getAuthHeaders() }
      );
      
      if (response.ok) {
        const session = await response.json();
        setCurrentSessionId(session.id);
        
        const messagesResponse = await fetch(
          `/backend/api/chat/${session.id}/messages`,
          { headers: getAuthHeaders() }
        );
        if (messagesResponse.ok) {
          const response = await messagesResponse.json();
          const messages = response.messages || [];
          const formattedMessages = messages.map((msg: any) => ({
            ...msg,
            createdAt: new Date(msg.createdAt || msg.timestamp)
          }));
          setChatHistory(formattedMessages);
        }
      } else if (response.status === 404) {
        await createNewSession(documentId);
      } else {
        handleDocumentDeleted();
      }
    } catch (error) {
      console.error('Failed to load or create session:', error);
      if (!currentSessionId) {
        await createNewSession(currentDocument.databaseId || currentDocument.id);
      }
    } finally {
      setIsCreatingSession(false);
    }
  };
  
  const createNewSession = async (documentId?: string) => {
    if (!user || !currentDocument || isCreatingSession) return;
    if(!currentDocument.databaseId){
      toast.error('Document is not saved to your account');
      return;
    }
    try {
      setIsCreatingSession(true);
      const useDocumentId = documentId || currentDocument.databaseId || currentDocument.id;
      
      const response = await fetch('/backend/api/chat-sessions', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userId: user.id,
          documentId: useDocumentId,
          title: `Chat with ${currentDocument.originalName}`,
          isSaved: false
        })
      });
  
      if (response.ok) {
        const session = await response.json();
        setCurrentSessionId(session.id);
        setChatHistory([]);
        console.log('New chat session created:', session.id);
      } else {
        throw new Error('Failed to create session');
      }
    } catch (error) {
      handleDocumentDeleted(); // if document is deleted, reset to upload page
    } finally {
      setIsCreatingSession(false);
    }
  };

  const saveSessionToDatabase = async () => {
    if (!currentSessionId || !user || chatHistory.length === 0) return;

    try {
      const firstUserMessage = chatHistory.find(m => m.type === 'USER');
      const title = firstUserMessage 
        ? `${firstUserMessage.content.substring(0, 50)}${firstUserMessage.content.length > 50 ? '...' : ''}`
        : `Chat with ${currentDocument?.originalName || 'Document'}`;

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

  // Function to handle when current document is deleted
  const handleDocumentDeleted = () => {
    // Reset all state to go back to upload page
    setCurrentSessionId(null);
    setChatHistory([]);
    setCurrentDocument(null);
    setQuery('');
    setError('');
    setShowPresets(true);
    
    // Notify parent component to update system status
    onUploadSuccess({
      documentId: '',
      filename: '',
      originalName: '',
      size: 0,
      uploadedAt: '',
      pages_processed: 0
    });
    
    toast.info('Document was deleted - returned to upload page');
  };

  const addMessage = async (message: Omit<ChatMessage, 'id' | 'createdAt'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };

    setChatHistory(prev => [...prev, newMessage]);

    if (currentSessionId) {
      try {
        const response = await fetch('/backend/api/chat-messages', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            id: newMessage.id,
            sessionId: currentSessionId,
            role: newMessage.type.toUpperCase(),
            content: newMessage.content,
            createdAt: newMessage.createdAt.toISOString(),
            tokensUsed: 0
          })
        });

        if (response.ok) {
          const savedMessage = await response.json();
          console.log('Message saved successfully:', savedMessage.messageId || savedMessage.id);
        }
      } catch (error) {
        console.error('Failed to save message to database:', error);
      }
    }
  };

  const handleQuery = async (queryText?: string) => {
    const currentQuery = queryText || query;
    
    if (!currentQuery.trim()) {
      setError('Please enter a query');
      return;
    }

    if (!currentSessionId && user && currentDocument) {
      if (isCreatingSession) {
        toast.info('Creating session, please wait...');
        return;
      }
      await createNewSession();
      
      if (!currentSessionId) {
        setError('Failed to create chat session');
        return;
      }
    }

    await addMessage({
      type: 'USER',
      content: currentQuery,
      query: currentQuery
    });

    setIsQuerying(true);
    setError('');
    setQuery('');
    setShowPresets(false);

    try {
      const result = await apiService.queryDocuments(currentQuery);
      
      await addMessage({
        type: 'ASSISTANT',
        content: result.response,
        query: currentQuery,
        sourceCount: result.source_count
      });
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      
      await addMessage({
        type: 'ASSISTANT',
        content: `Sorry, I encountered an error: ${errorMessage}`,
        query: currentQuery
      });
    } finally {
      setIsQuerying(false);
    }
  };

  const handleNewChat = async () => {
    try {
      console.log('🆕 Starting new chat - resetting all state');
      
      // Clear ALL state - complete reset
      setCurrentSessionId(null);
      setChatHistory([]);
      setCurrentDocument(null);
      setQuery('');
      setError('');
      setShowPresets(true);
      
      // Reset system
      await apiService.resetSystem();
      
      // Trigger parent component reset by calling onUploadSuccess with empty data
      onUploadSuccess({
        documentId: '',
        filename: '',
        originalName: '',
        size: 0,
        uploadedAt: '',
        pages_processed: 0
      });
      
      console.log('✅ ChatViewer reset complete');
      
    } catch (error) {
      console.error('Failed to reset:', error);
      toast.error('Failed to reset');
    }
  };

  const handleSaveModal = () => {
    setIsSaveModalOpen(true);
  };

  const handleSaveFile = async () => {
    if (!currentDocument || !isAuthenticated || !user) {
      toast.error('No document to save or user not authenticated');
      return;
    }
  
    const documentStatus = currentDocument.status
    
    console.log('📄 Document status check:', {
      originalStatus: currentDocument.status,
      normalizedStatus: documentStatus,
      documentId: currentDocument.id
    });
  
    // Check if document is already saved (indexed status means it's saved)
    if (documentStatus === 'INDEXED') {
      toast.info('Document is already saved to your account');
      return;
    }
    const savableStatuses = ['TEMPORARY', 'READY', 'UPLOADED'];

    // ✅ FIX: Allow saving of temporary documents (handle both 'temporary' and 'temp')
    if (!savableStatuses.includes(documentStatus)) {
      toast.error(`Cannot save document with status: ${currentDocument.status}. Only temporary documents can be saved.`);
      return;
    }
  
    try {
      setIsSaving(true);
      
      const response = await fetch('/backend/api/documents/save-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authUtils.getToken()}`,
        },
        body: JSON.stringify({
          document_id: currentDocument.id,
          title: currentDocument.originalName || 'Untitled',
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save document');
      }
  
      const savedDocumentInfo = await response.json();
      
      // Update current document with new info
      setCurrentDocument({
        ...currentDocument,
        status: 'INDEXED', // Now saved to cloud
        s3Key: savedDocumentInfo.s3Key,
        s3Url: savedDocumentInfo.s3Url
      });
      
      setIsSaveModalOpen(false);
      toast.success('Document saved to your account and cloud storage!');
      
    } catch (error: any) {
      console.error('Failed to save file:', error);
      
      if (error.message.includes('Temporary file not found') || error.message.includes('no longer available')) {
        toast.error('Document file expired. Please re-upload the document.'+ documentStatus);
        handleNewChat();
      } else {
        toast.error(error.message || 'Failed to save file to account');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadSuccess = (response: UploadResponse) => {
    // Update current document when upload is successful
    const documentInfo = {
      id: response.documentId,
      filename: response.filename,
      originalName: response.originalName || response.filename,
      size: response.size || 0,
      uploadedAt: response.uploadedAt || new Date().toISOString(),
      pages: response.pages_processed,
      status: response.status,
      databaseId: response.documentId
    };
    
    setCurrentDocument(documentInfo);
    
    // Call the parent success handler
    onUploadSuccess(response);
    
    toast.success('Document uploaded and ready to chat!');
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
                <button 
                  onClick={handleSaveModal}
                  disabled={currentDocument?.status === 'INDEXED'}
                  className={`flex items-center cursor-pointer p-2 px-3 text-sm rounded-lg transition-all duration-300 ${
                    currentDocument?.status === 'INDEXED' 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : ' text-black hover:brightness-105 hover:bg-yellow-200/20 hover:text-yellow-600'
                  }`}
                >
                  <GoDownload className="w-4 h-4 mr-1" />
                  {currentDocument?.status === 'INDEXED' ? 'Saved' : 'Save File'}
                </button>

                <button 
                  onClick={handleNewChat}
                  className="flex items-center cursor-pointer p-2 px-3 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all duration-300"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  New Chat
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
          /* Upload Section - Use UploadPage Component */
          <div className="flex-1 flex flex-col justify-center p-8 max-w-2xl mx-auto w-full">
            <UploadPage onUploadSuccess={handleUploadSuccess} />
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
              {/* Preset Queries */}
              {showPresets && Object.keys(presetQueries).length > 0 && chatHistory.length === 0 && (
                <div className="flex-shrink-0 pb-6">
                  <div className="flex gap-2 flex-wrap justify-start">
                    {Object.entries(presetQueries).map(([key, value]) => (
                      <button
                        key={key}
                        onClick={() => setQuery(value)}
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

        {/* Save Document Modal */}
        {isSaveModalOpen && (
          <SaveDocumentModal
            isOpen={isSaveModalOpen}
            onClose={() => setIsSaveModalOpen(false)}
            onSave={handleSaveFile}
          />
        )}
      </div>
      <Toaster />
    </div>
  );
}