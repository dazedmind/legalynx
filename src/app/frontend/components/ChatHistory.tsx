// Updated ChatHistory.tsx - Pass session ID to parent
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
  };
}

interface ChatHistoryProps {
  onDocumentSelect?: (docId: string) => void;
  onSessionSelect?: (sessionId: string, documentId: string) => void; // Add this prop
  onDocumentDeleted?: (docId: string) => void; // Add this prop
  currentDocumentId?: string;
}

export default function ChatHistory({ onDocumentSelect, onSessionSelect, currentDocumentId, onDocumentDeleted }: ChatHistoryProps) {
  const { isAuthenticated, user } = useAuth();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

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

  const loadChatSessions = async () => {
    if (!user || !isAuthenticated) {
      // Clear sessions if no user
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
      
      // Always try to parse the response, even if not ok
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.log('Failed to parse response, treating as empty:', parseError);
        data = { sessions: [] };
      }
      
      if (response.ok) {
        const sessions = data.sessions || [];
        
        const formattedSessions = sessions.map((session: any) => ({
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
            filename: session.documentName || 'Unknown',
            originalName: session.documentName || 'Unknown Document'
          }
        }));
        
        setChatSessions(formattedSessions);
        setError(''); // Clear any previous errors
        
      } else if (response.status === 401) {
        // Handle authentication errors gracefully
        console.log('Authentication failed, clearing sessions');
        setChatSessions([]);
        setError(''); // Don't show auth errors as user errors
        
      } else {
        // Handle other errors gracefully
        console.log('Failed to load sessions, using empty array');
        setChatSessions([]);
        setError(''); // Don't show these errors to user
      }
      
    } catch (error) {
      console.log('Network or other error loading chat sessions:', error);
      
      // Always fallback to empty sessions instead of showing errors
      setChatSessions([]);
      setError(''); // Don't show network errors to user
      
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to handle session deletion gracefully
  const handleDeleteSession = async (sessionId: string, deleteFile: boolean = false, event?: React.MouseEvent) => {
    event?.stopPropagation();
    
    const confirmMessage = deleteFile 
      ? 'Are you sure you want to delete this chat session AND the associated document file? This will remove the file completely and cannot be undone.'
      : 'Are you sure you want to delete this chat session? This action cannot be undone.';
      
    if (!confirm(confirmMessage)) {
      return;
    }
  
    try {
      // Build the delete URL with query parameters
      const deleteUrl = `/backend/api/chat-sessions?sessionId=${sessionId}&deleteDocument=${deleteFile}`;
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
  
      // Always treat as success since API returns 200 even for missing sessions
      if (response.ok) {
        const result = await response.json();
        
        // Remove from local state
        setChatSessions(prev => prev.filter(session => session.id !== sessionId));
        
        if (selectedSession === sessionId) {
          setSelectedSession(null);
        }
        
        if (result.documentDeleted) {
          toast.success('Chat session and document file deleted successfully');
        } else {
          toast.success('Chat session deleted successfully');
        }
        
      } else {
        // Even if response not ok, try to refresh the list
        console.log('Delete request failed, refreshing session list');
        await loadChatSessions();
        toast.info('Session list refreshed');
      }
      
    } catch (error) {
      console.log('Failed to delete session, refreshing list:', error);
      
      // Always try to refresh the list on error
      await loadChatSessions();
      toast.info('Refreshed session list');
    }
  };

  const handleSessionSelect = async (sessionId: string, documentId: string) => {
    setSelectedSession(sessionId);
    
    try {
      const session = chatSessions.find(s => s.id === sessionId);
      if (session) {
        // Call the new session select callback with session ID
        onSessionSelect?.(sessionId, documentId);
        
        // Also call document select for backward compatibility
        onDocumentSelect?.(documentId);
        
      }
    } catch (error) {
      console.error('Failed to select session:', error);
      toast.error('Failed to select session');
    }
  };

  const handleRefresh = () => {
    if (user && isAuthenticated) {
      loadChatSessions();
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

  const truncateText = (text: string, maxLength: number = 100): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getLastMessage = (session: ChatSession): string => {
    if (!session.messages || session.messages.length === 0) {
      return 'No messages yet';
    }

    const lastAssistantMessage = [...session.messages]
      .reverse()
      .find(m => m.type === 'assistant');
    
    return lastAssistantMessage 
      ? lastAssistantMessage.content 
      : session.messages[session.messages.length - 1].content;
  };

  // Rest of your component remains the same...
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
          {user && isAuthenticated && (
            <button
              onClick={handleRefresh}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Refresh
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          <AlertCircle className="w-5 h-5 inline mr-2" />
          {error}
          {user && isAuthenticated && (
            <button 
              onClick={handleRefresh}
              className="ml-2 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          )}
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
          </div>

          {/* Chat Sessions List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {chatSessions.map((session) => (
              <div
                key={session.id}
                className={`grid grid-cols-12 gap-4 p-4 border rounded-lg transition-colors cursor-pointer hover:bg-gray-50 ${
                  selectedSession === session.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
                onClick={() => handleSessionSelect(session.id, session.documentId)}
              >
                {/* Session Title */}
                <div className="col-span-4 flex items-center">
                  <MessageSquare className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {session.title || `Chat with ${session.document.originalName}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {(session.messages || []).length} messages
                      </span>
                      {session.isSaved && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          Saved
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Document Name */}
                <div className="col-span-4 flex items-center">
                  <FileText className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                  <p className="text-sm text-gray-600 truncate">{session.document.originalName}</p>
                </div>


                {/* Date */}
                <div className="col-span-3 flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-1" />
                  <div className="min-w-0">
                    <p className="truncate">{formatDate(session.updatedAt)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-1 flex items-center justify-end">
                  <button 
                    onClick={(e) => handleDeleteSession(session.id, true, e)}
                    className="cursor-pointer p-2 rounded-full text-red-600 hover:text-red-800 hover:bg-red-100 transition-colors"
                    title="Delete session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Total conversations: {chatSessions.length}</span>
          {selectedSession && (
            <span className="text-blue-600">Session selected - Switch to chat to continue</span>
          )}
        </div>
      </div>
    </div>
  );
}