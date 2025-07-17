// Fixed ChatHistory.tsx - Handles missing documents gracefully
'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Trash2, Calendar, MessageSquare, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { authUtils } from '@/lib/auth';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  query?: string;
  sourceCount?: number;
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
  document: {
    id: string;
    filename: string;
    originalName: string;
    filePath?: string;
    exists?: boolean; // Add this to track if document exists
  };
}

interface ChatHistoryProps {
  onDocumentSelect?: (docId: string) => void;
  onSessionSelect?: (sessionId: string, documentId: string) => void;
  onDocumentDeleted?: (docId: string) => void;
  currentDocumentId?: string;
}

export default function ChatHistory({ 
  onDocumentSelect, 
  onSessionSelect, 
  currentDocumentId, 
  onDocumentDeleted 
}: ChatHistoryProps) {
  const { isAuthenticated, user } = useAuth();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

  useEffect(() => {
    if (user && isAuthenticated) {
      loadChatSessions();
    }
  }, [user, isAuthenticated]);

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

  // Check if a document exists in the database
  const checkDocumentExists = async (documentId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/backend/api/documents/check/${documentId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      return response.ok;
    } catch (error) {
      console.log('Error checking document existence:', error);
      return false;
    }
  };

  const loadChatSessions = async () => {
    if (!user || !isAuthenticated) {
      setChatSessions([]);
      setError('');
      return;
    }
  
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/backend/api/chat', {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.log('Failed to parse response, treating as empty:', parseError);
        data = { sessions: [] };
      }
      
      if (response.ok) {
        const sessions = data.sessions || [];
        
        // Check document existence for each session
        const formattedSessions = await Promise.all(
          sessions.map(async (session: any) => {
            const documentExists = await checkDocumentExists(session.documentId);
            
            return {
              ...session,
              createdAt: new Date(session.createdAt),
              updatedAt: new Date(session.updatedAt),
              messages: (session.messages || []).map((msg: any) => ({
                ...msg,
                type: msg.role || msg.type,
                timestamp: new Date(msg.createdAt || msg.timestamp)
              })),
              document: {
                id: session.documentId,
                filename: session.documentName || session.document?.filename || 'Unknown',
                originalName: session.documentName || session.document?.originalName || 'Unknown Document',
                filePath: session.document?.filePath || session.document?.file_path,
                exists: documentExists // Mark if document exists
              }
            };
          })
        );
        
        setChatSessions(formattedSessions);
        setError('');
        
      } else if (response.status === 401) {
        console.log('Authentication failed, clearing sessions');
        setChatSessions([]);
        setError('');
      } else {
        console.log('Failed to load sessions, using empty array');
        setChatSessions([]);
        setError('');
      }
      
    } catch (error) {
      console.log('Network or other error loading chat sessions:', error);
      setChatSessions([]);
      setError('');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to load PDF document into RAG system - with error handling
  const loadPdfForSession = async (documentId: string): Promise<boolean> => {
    try {
      setIsLoadingPdf(true);
      console.log('🔄 Loading PDF for document:', documentId);
      
      // First, check if document exists
      const documentExists = await checkDocumentExists(documentId);
      if (!documentExists) {
        throw new Error('Document no longer exists in the database');
      }
      
      // Get the document details from the database
      const documentResponse = await fetch(`/backend/api/documents/${documentId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!documentResponse.ok) {
        if (documentResponse.status === 404) {
          throw new Error('Document file not found');
        }
        const errorData = await documentResponse.json();
        throw new Error(errorData.error || 'Failed to get document details');
      }
      
      const documentData = await documentResponse.json();
      console.log('📄 Document details loaded:', documentData.originalName);
      
      // Check if the document file exists and get the file
      const fileResponse = await fetch(`/backend/api/documents/${documentId}/file`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!fileResponse.ok) {
        if (fileResponse.status === 404) {
          throw new Error('Document file not found in storage');
        }
        const errorData = await fileResponse.json();
        throw new Error(errorData.error || 'Failed to get document file');
      }
      
      // Get the file blob
      const fileBlob = await fileResponse.blob();
      console.log('📁 File blob received, size:', fileBlob.size);
      
      // Create a File object from the blob
      const file = new File([fileBlob], documentData.originalName, { 
        type: 'application/pdf' 
      });
      
      // Upload to RAG system
      console.log('📤 Uploading to RAG system...');
      const formData = new FormData();
      formData.append('file', file);
      
      const ragResponse = await fetch('http://localhost:8000/upload-pdf', {
        method: 'POST',
        body: formData
      });
      
      if (!ragResponse.ok) {
        const ragError = await ragResponse.text();
        throw new Error(`RAG system error: ${ragError}`);
      }
      
      const ragResult = await ragResponse.json();
      console.log('✅ PDF successfully loaded into RAG system:', ragResult);
      return true;
      
    } catch (error) {
      console.error('❌ Failed to load PDF for session:', error);
      throw error;
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const handleSessionSelect = async (sessionId: string, documentId: string) => {
    setSelectedSession(sessionId);
    
    try {
      const session = chatSessions.find(s => s.id === sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Check if document exists before attempting to load
      if (!session.document.exists) {
        toast.error('Document no longer exists. This session cannot be loaded.');
        return;
      }
      
      // Show loading toast
      const loadingToastId = toast.loading('Loading document and chat session...');
      
      // Load the PDF document into RAG system first
      try {
        await loadPdfForSession(documentId);
        toast.success('Document loaded successfully', { id: loadingToastId });
      } catch (pdfError) {
        console.error('Failed to load PDF:', pdfError);
        
        // Handle different types of errors
        const errorMessage = pdfError instanceof Error ? pdfError.message : 'Unknown error';
        
        if (errorMessage.includes('not found') || errorMessage.includes('404')) {
          toast.error('Document file not found. It may have been deleted.', { 
            id: loadingToastId 
          });
          
          // Mark document as non-existent and refresh sessions
          await loadChatSessions();
          return;
        } else {
          toast.error('Failed to load document. You may not be able to ask new questions.', { 
            id: loadingToastId 
          });
        }
      }
      
      // Call the session select callback
      onSessionSelect?.(sessionId, documentId);
      
      // Also call document select for backward compatibility
      onDocumentSelect?.(documentId);
      
    } catch (error) {
      console.error('Failed to select session:', error);
      toast.error('Failed to select session');
    }
  };

  const handleDeleteSession = async (sessionId: string, deleteFile: boolean = false, event?: React.MouseEvent) => {
    event?.stopPropagation();
    
    const session = chatSessions.find(s => s.id === sessionId);
    const documentExists = session?.document.exists;
    
    let confirmMessage = 'Are you sure you want to delete this chat session? This action cannot be undone.';
    
    if (deleteFile && documentExists) {
      confirmMessage = 'Are you sure you want to delete this chat session AND the associated document file? This will remove the file completely and cannot be undone.';
    } else if (deleteFile && !documentExists) {
      confirmMessage = 'The document file no longer exists. Do you want to delete this chat session?';
    }
      
    if (!confirm(confirmMessage)) {
      return;
    }
  
    try {
      // If trying to delete file but document doesn't exist, just delete the session
      const actuallyDeleteFile = deleteFile && documentExists;
      const deleteUrl = `/backend/api/chat-sessions/${sessionId}${actuallyDeleteFile ? '?deleteFile=true' : ''}`;
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
  
      if (response.ok) {
        setChatSessions(prev => prev.filter(session => session.id !== sessionId));
        
        if (selectedSession === sessionId) {
          setSelectedSession(null);
        }
        
        if (actuallyDeleteFile && onDocumentDeleted) {
          onDocumentDeleted(session!.documentId);
        }
        
        toast.success('Chat session deleted successfully');
        
      } else {
        console.log('Delete request failed, refreshing session list');
        await loadChatSessions();
        toast.info('Session list refreshed');
      }
      
    } catch (error) {
      console.log('Failed to delete session, refreshing list:', error);
      await loadChatSessions();
      toast.info('Refreshed session list');
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Chat History</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center text-sm text-gray-600">
            <MessageSquare className="w-4 h-4 mr-1" />
            {chatSessions.length} session{chatSessions.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          <AlertCircle className="w-5 h-5 inline mr-2" />
          {error}
        </div>
      )}

      {isLoadingPdf && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-700">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Loading document into RAG system...
          </div>
        </div>
      )}

      {!user || !isAuthenticated ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <MessageSquare className="mx-auto w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Please sign in</p>
            <p className="text-sm">Sign in to view your chat history</p>
          </div>
        </div>
      ) : chatSessions.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <MessageSquare className="mx-auto w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No chat history</p>
            <p className="text-sm">Start chatting with your documents to see sessions here</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 p-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-600 mb-4">
            <div className="col-span-4">Session Title</div>
            <div className="col-span-4">Document</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Actions</div>
          </div>

          {/* Chat Sessions List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {chatSessions.map((session) => (
              <div
                key={session.id}
                className={`grid grid-cols-12 gap-4 p-4 border rounded-lg transition-colors ${
                  !session.document.exists 
                    ? 'bg-red-50 border-red-200 cursor-not-allowed' 
                    : `cursor-pointer hover:bg-gray-50 ${
                        selectedSession === session.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`
                } ${isLoadingPdf ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => session.document.exists && !isLoadingPdf && handleSessionSelect(session.id, session.documentId)}
              >
                {/* Session Title */}
                <div className="col-span-4 flex items-center">
                  <div className="flex items-center">
                    {!session.document.exists && (
                      <AlertCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                    )}
                    <MessageSquare className={`w-5 h-5 mr-3 flex-shrink-0 ${
                      session.document.exists ? 'text-blue-500' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="min-w-0">
                    <p className={`font-medium truncate ${
                      session.document.exists ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {session.title || `Chat with ${session.document.originalName}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs ${
                        session.document.exists ? 'text-gray-500' : 'text-red-500'
                      }`}>
                        {(session.messages || []).length} messages
                        {!session.document.exists && ' • Document deleted'}
                      </span>
                      {session.isSaved && session.document.exists && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          Saved
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Document Name */}
                <div className="col-span-4 flex items-center">
                  <FileText className={`w-4 h-4 mr-2 flex-shrink-0 ${
                    session.document.exists ? 'text-gray-400' : 'text-red-400'
                  }`} />
                  <p className={`text-sm truncate ${
                    session.document.exists ? 'text-gray-600' : 'text-red-600'
                  }`}>
                    {session.document.originalName}
                    {!session.document.exists && ' (deleted)'}
                  </p>
                </div>

                {/* Date */}
                <div className="col-span-2 flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-1" />
                  <div className="min-w-0">
                    <p className="truncate">{formatDate(session.updatedAt)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end space-x-2">
                  {session.document.exists && (
                    <button 
                      onClick={(e) => handleDeleteSession(session.id, true, e)}
                      disabled={isLoadingPdf}
                      className="cursor-pointer p-2 rounded-full text-red-600 hover:text-red-800 hover:bg-red-100 transition-colors disabled:opacity-50"
                      title="Delete session and file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>
            Total conversations: {chatSessions.length}
            {chatSessions.some(s => !s.document.exists) && (
              <span className="text-red-600 ml-2">
                • {chatSessions.filter(s => !s.document.exists).length} with deleted documents
              </span>
            )}
          </span>
          {selectedSession && (
            <span className="text-blue-600">
              {isLoadingPdf ? 'Loading document...' : 'Session selected - Switch to chat to continue'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}