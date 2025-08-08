// SavedChatHistory.tsx - FIXED VERSION with proper session loading and scrollable sessions
'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Calendar, MessageSquare, AlertCircle, Eye, Trash2, RotateCcw, MessageSquarePlus } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { authUtils } from '@/lib/auth';
import { toast } from 'sonner';

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
      console.log('📚 Loading saved chat sessions...');
      
      // Get chat sessions - API already filters for INDEXED documents
      const response = await fetch('/backend/api/chat', {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to load sessions`);
      }
      
      const data = await response.json();
      const sessions = data.sessions || [];
      
      console.log(`📊 Loaded ${sessions.length} saved sessions`);
      
      // Transform to our simplified format
      const formattedSessions: SavedChatSession[] = sessions.map((session: any) => ({
        id: session.id,
        title: session.title || `Chat with ${session.documentName}`,
        documentId: session.documentId,
        documentName: session.documentName,
        fileName: session.document.fileName,
        messageCount: session.messages?.length || 0,
        lastMessage: session.lastMessage || session.messages?.[0]?.content || null,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        document: {
          id: session.documentId,
          originalFileName: session.documentName,
          fileSize: session.document?.fileSize || 0,
          pageCount: session.document?.pageCount || 0,
          status: session.document.status
        }
      }));
      
      // Sort by most recent first
      formattedSessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      
      setSavedSessions(formattedSessions);
      setError('');
    } catch (error) {
      console.error('Failed to load saved sessions:', error);
      setError('Failed to load chat history');
      setSavedSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Fixed: Proper session click handler that calls the parent's onSessionSelect
  const handleSessionClick = async (session: SavedChatSession) => {
    try {
      console.log(`🔄 Opening session: ${session.title}`);
      
      // Show loading toast
      const loadingToastId = toast.loading('Opening chat session...');
      
      // ✅ Call the session selection handler passed from parent
      if (onSessionSelect) {
        onSessionSelect(session.id);
      }
      
      // Success message
      toast.success('Chat session opened', { id: loadingToastId });
      
    } catch (error) {
      console.error('Failed to open session:', error);
      toast.error('Failed to open chat session');
    }
  };

  const handleDeleteSession = async (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the session click
    
    const session = savedSessions.find(s => s.id === sessionId);
    if (!session) return;
    
    const confirmed = confirm(
      `Are you sure you want to delete the chat session "${session.title}"? This action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    try {
      const response = await fetch(`/backend/api/chat-sessions/${sessionId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        // Remove from local state
        setSavedSessions(prev => prev.filter(s => s.id !== sessionId));
        
        // Notify parent component
        onSessionDelete?.(sessionId);
        
        toast.success('Chat session deleted successfully');
      } else {
        throw new Error('Failed to delete session');
      }
      
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast.error('Failed to delete chat session');
      
      // Refresh the list in case of error
      await loadSavedSessions();
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
            <MessageSquarePlus className="w-4 h-4" />
            <span className="hidden md:block">New Chat</span>
          </button>

          <button
            onClick={loadSavedSessions}
            disabled={isLoading}
            className="flex items-center px-4 py-3 text-md bg-yellow-100/20 text-yellow-500 rounded-md hover:bg-yellow/20 transition-colors disabled:opacity-50 cursor-pointer"
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
            <p className="text-lg font-medium mb-2">No saved chats yet</p>
            <p className="text-sm">Upload and save documents to start chatting</p>
            <p className="text-xs text-muted-foreground mt-2">
              Only conversations with saved documents will appear here
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
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      className="p-2 text-destructive hover:bg-destructive/20 rounded-full transition-colors cursor-pointer"
                      title="Delete chat session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Last Message Preview */}
                {session.lastMessage && (
                  <div className="mb-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {session.lastMessage.length > 150 
                        ? `${session.lastMessage.substring(0, 150)}...`
                        : session.lastMessage
                      }
                    </p>
                  </div>
                )}

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
                    {session.document.fileSize > 0 && (
                      <span>{formatFileSize(session.document.fileSize)}</span>
                    )}
                    {session.document.pageCount > 0 && (
                      <span>{session.document.pageCount} pages</span>
                    )}
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
    </div>
  );
}