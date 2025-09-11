// SavedChatHistory.tsx - FIXED VERSION with proper session loading and scrollable sessions
'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Calendar, MessageSquare, AlertCircle, Eye, Trash2, RotateCcw, MessageSquarePlus, DiamondPlus } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { authUtils } from '@/lib/auth';
import { toast } from 'sonner';
import ConfirmationModal from '../../../components/ConfirmationModal';
import { ModalType } from '../../../components/ConfirmationModal';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SavedChatSession {
  id: string;
  title: string;
  documentId: string;
  documentName: string;
  fileName: string;
  messageCount: number;
  lastMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  hasSession: boolean; // New field to indicate if this document has a chat session
  sessionId?: string; // Optional session ID
  document: {
    id: string;
    originalFileName: string;
    fileSize: number;
    pageCount: number;
    status: string;
  };
}

interface SavedChatHistoryProps {
  onSessionDelete?: (sessionId: string) => void;
  onSessionSelect?: (sessionId: string) => void;
  currentSessionId?: string;
  onDocumentSelect: (documentId: string) => void;
  currentDocumentId: string;
  handleNewChat?: () => void;

}

export default function SavedChatHistory({ 
  onSessionDelete,
  onSessionSelect,
  currentSessionId,
  onDocumentSelect,
  currentDocumentId,
  handleNewChat
}: SavedChatHistoryProps) {
  const { isAuthenticated, user } = useAuth();
  const [savedSessions, setSavedSessions] = useState<SavedChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    itemId: string;
    itemTitle: string;
  } | null>(null);

  useEffect(() => {
    if (user && isAuthenticated) {
      loadSavedSessions();
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

  const loadSavedSessions = async () => {
    if (!user || !isAuthenticated) {
      setSavedSessions([]);
      setError('');
      return;
    }
  
    setIsLoading(true);
    setError('');
    
    try {
      console.log('📚 Loading all documents and chat sessions...');
      
      // Fetch both documents and sessions in parallel
      const [documentsResponse, sessionsResponse] = await Promise.all([
        fetch('/backend/api/documents', {
          method: 'GET',
          headers: getAuthHeaders()
        }),
        fetch('/backend/api/chat', {
          method: 'GET',
          headers: getAuthHeaders()
        })
      ]);
      
      if (!documentsResponse.ok) {
        throw new Error(`HTTP ${documentsResponse.status}: Failed to load documents`);
      }
      
      if (!sessionsResponse.ok) {
        throw new Error(`HTTP ${sessionsResponse.status}: Failed to load sessions`);
      }
      
      const documentsData = await documentsResponse.json();
      const sessionsData = await sessionsResponse.json();
      
      const documents = Array.isArray(documentsData?.documents) ? documentsData.documents : [];
      const sessions = Array.isArray(sessionsData?.sessions) ? sessionsData.sessions : [];

      console.log(`📊 Loaded ${documents.length} documents and ${sessions.length} sessions`);
      
      // Create a map of sessions by document ID for quick lookup
      const sessionsByDocumentId = new Map();
      sessions.forEach((session: any) => {
        sessionsByDocumentId.set(session.documentId, session);
      });
      
      // Transform all documents to our format, including session info if available
      const formattedSessions: SavedChatSession[] = documents.map((doc: any) => {
        const session = sessionsByDocumentId.get(doc.id);
        const hasSession = !!session;
        
        return {
          id: hasSession ? session.id : `doc_${doc.id}`, // Use session ID if available, otherwise create a document-based ID
          title: hasSession ? session.title : `${doc.originalFileName}`,
          documentId: doc.id,
          documentName: doc.originalFileName,
          fileName: doc.fileName,
          messageCount: hasSession ? (Array.isArray(session.messages) ? session.messages.length : 0) : 0,
          lastMessage: hasSession ? (session.lastMessage || session.messages?.[0]?.content || null) : null,
          createdAt: hasSession ? new Date(session.createdAt) : new Date(doc.uploadedAt),
          updatedAt: hasSession ? new Date(session.updatedAt) : new Date(doc.uploadedAt),
          hasSession,
          sessionId: hasSession ? session.id : undefined,
          document: {
            id: doc.id,
            originalFileName: doc.originalFileName,
            fileSize: doc.fileSize || 0,
            pageCount: doc.pageCount || 0,
            status: doc.status || 'UNKNOWN'
          }
        };
      });
      
      // Sort by most recent first (prioritize sessions with messages, then by upload/update time)
      formattedSessions.sort((a, b) => {
        // First, prioritize documents with sessions
        if (a.hasSession && !b.hasSession) return -1;
        if (!a.hasSession && b.hasSession) return 1;
        
        // Then sort by most recent activity
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      });
      
      setSavedSessions(formattedSessions);
      setError('');
    } catch (error) {
      console.error('Failed to load documents and sessions:', error);
      setError('Failed to load chat history');
      setSavedSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Fixed: Proper session/document click handler
  const handleSessionClick = async (session: SavedChatSession) => {
    try {
      console.log(`🔄 Opening ${session.hasSession ? 'session' : 'document'}: ${session.title}`);
      console.log('📊 Session details:', {
        hasSession: session.hasSession,
        sessionId: session.sessionId,
        documentId: session.documentId,
        messageCount: session.messageCount
      });
      
      // Show loading toast
      const loadingToastId = toast.loading(
        session.hasSession ? 'Opening chat session...' : 'Opening document...'
      );
      
      if (session.hasSession && session.sessionId) {
        // If this document has a chat session, load the session
        console.log('📞 Calling onSessionSelect with:', session.sessionId);
        if (onSessionSelect) {
          onSessionSelect(session.sessionId);
        }
        toast.success('Chat session opened', { id: loadingToastId });
      } else {
        // If this document doesn't have a session, load the document directly
        console.log('📞 Calling onDocumentSelect with:', session.documentId);
        if (onDocumentSelect) {
          onDocumentSelect(session.documentId);
        }
        toast.success('Document opened', { id: loadingToastId });
      }
      
    } catch (error) {
      console.error('Failed to open:', error);
      toast.error('Failed to open item');
    }
  };

  const handleDeleteItem = async (itemId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the session click
    
    const item = savedSessions.find(s => s.id === itemId);
    if (!item) return;
    
    // Open confirmation modal
    setConfirmationModal({
      isOpen: true,
      itemId: itemId,
      itemTitle: item.title
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmationModal) return;
    
    const item = savedSessions.find(s => s.id === confirmationModal.itemId);
    if (!item) return;
    
    try {
      // ✅ FIXED: Always delete the document (which will cascade delete sessions)
      const response = await fetch(`/backend/api/documents?id=${item.documentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        // Notify parent component about session deletion if there was a session
        if (item.hasSession && item.sessionId) {
          onSessionDelete?.(item.sessionId);
        }
        
        // ✅ FIXED: Also remove from localStorage
        try {
          const storageKey = user?.id ? `uploaded_documents_${user.id}` : 'uploaded_documents';
          const savedDocs = localStorage.getItem(storageKey);
          if (savedDocs) {
            const docs = JSON.parse(savedDocs);
            const filteredDocs = docs.filter((doc: any) => 
              doc.id !== item.documentId && doc.documentId !== item.documentId
            );
            localStorage.setItem(storageKey, JSON.stringify(filteredDocs));
            console.log('✅ Removed document from localStorage');
          }
        } catch (localStorageError) {
          console.warn('Failed to remove from localStorage:', localStorageError);
        }
        
        toast.success('Document and chat history deleted successfully');
        
        // Remove from local state
        setSavedSessions(prev => prev.filter(s => s.id !== confirmationModal.itemId));
        
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete document');
      }
      
    } catch (error) {
      console.error('Failed to delete document:', error);
      toast.error('Failed to delete document and chat history');
      
      // Refresh the list in case of error
      await loadSavedSessions();
    } finally {
      // Close the confirmation modal
      setConfirmationModal(null);
    }
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const truncateString = (str: string, maxLength: number): string => {
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
  };

  if (isLoading) {
    return (
      <div className="bg-primary rounded-lg shadow-md p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading saved chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-primary p-6 w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold font-serif text-foreground">Chat History</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {savedSessions.length} conversation{savedSessions.length !== 1 ? 's' : ''} with saved documents
          </p>
        </div>
        
        <span className='flex items-center gap-2'>
          <button
            onClick={() => handleNewChat?.()}
            disabled={isLoading}
            className="md:flex items-center px-3 py-2 gap-2 text-md bg-gradient-to-bl from-blue-500 to-indigo-700 hover:brightness-110 transition-all duration-300 text-white rounded-md hover:bg-blue-200 disabled:opacity-50 cursor-pointer"
            title="Add a new chat"
          >
            <DiamondPlus className="w-5 h-5" />
            <span className="hidden md:block">New Chat</span>
          </button>

          <button
            onClick={loadSavedSessions}
            disabled={isLoading}
            className="flex items-center px-4 py-3 text-md  text-yellow-500 rounded-md hover:bg-yellow/10 transition-all duration-300 ease-in-out disabled:opacity-50 cursor-pointer"
            title="Refresh chat history"
          >
            <RotateCcw className="w-5 h-5 " />
          </button>
        </span>
   
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive rounded-md text-destructive">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Content */}
      {!user || !isAuthenticated ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <MessageSquare className="mx-auto w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Please sign in</p>
            <p className="text-sm">Sign in to view your saved chat history</p>
          </div>
        </div>
      ) : savedSessions.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <MessageSquare className="mx-auto w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No documents yet</p>
            <p className="text-sm">Upload documents to start chatting</p>
            <p className="text-xs text-muted-foreground mt-2">
              All your uploaded documents will appear here
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          {/* Sessions List */}
          <div className="h-full overflow-y-auto space-y-3 scrollbar-hide">
            {savedSessions.map((session) => (
              <div
                key={session.id}
                className={`p-4 border rounded-lg transition-all duration-200 cursor-pointer hover:shadow-md hover:border-blue-300 ${
                  currentSessionId === session.id
                    ? 'border-blue-500 bg-blue/20 hover:bg-blue/30 shadow-sm'
                    : 'border-tertiary hover:bg-accent'
                }`}
                // ✅ Fixed: Direct function call that properly loads the session
                onClick={() => handleSessionClick(session)}
              >
                {/* Session Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate mb-1">
                      {session.title}
                    </h3>
                    <div className="flex items-center text-sm text-muted-foreground space-x-4">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-1" />
                        <span className="truncate max-w-[150px] sm:max-w-none">{session.fileName}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSessionClick(session);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue/20 rounded-full transition-colors cursor-pointer"
                      title="Open chat session"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteItem(session.id, e)}
                      className="p-2 text-destructive hover:bg-destructive/20 rounded-full transition-colors cursor-pointer"
                      title={session.hasSession ? "Delete chat session" : "Delete document"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Last Message Preview or Status */}
                {session.hasSession && session.lastMessage ? (
                  <div className="mb-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {session.lastMessage.length > 150 
                        ? `${session.lastMessage.substring(0, 150)}...`
                        : session.lastMessage
                      }
                    </p>
                  </div>
                ) : !session.hasSession ? (
                  <div className="mb-3">
                    <p className="text-sm text-muted-foreground italic">
                      No chat messages yet - Click to start chatting
                    </p>
                  </div>
                ) : null}

                {/* Session Footer */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-4">
                    {session.document.status === 'INDEXED' ? (
                      <div className="flex items-center">
                        <span className='text-xs text-blue-600 bg-blue-500/10 border border-blue-500 rounded-full px-2 py-1'>Saved Session</span>
                      </div>
                    ) : (
                      <span className='text-xs text-foreground border border-muted-foreground border-dashed rounded-full px-2 py-1'>Temporary Session</span>
                    )}
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>{formatDate(session.updatedAt)}</span>
                    </div>
                  </div>
                 
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      {savedSessions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-tertiary">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>
              {savedSessions.length} saved conversation{savedSessions.length !== 1 ? 's' : ''}
            </span>
            {currentSessionId && (
              <span className="text-blue-600 font-medium">
                Session selected
              </span>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmationModal && (
        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          onClose={() => setConfirmationModal(null)}
          onSave={handleConfirmDelete}
          modal={{
            header: 'Delete Chat',
            message: `Are you sure you want to delete "${confirmationModal.itemTitle}"? This will remove the document and all associated chat history. This action cannot be undone.`,
            trueButton: 'Delete',
            falseButton: 'Cancel',
            type: ModalType.DANGER
          }}
        />
      )}
    </div>
  );
}