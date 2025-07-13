'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Trash2, Calendar, MessageSquare, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
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
  currentDocumentId?: string;
}

export default function ChatHistory({ onDocumentSelect, currentDocumentId }: ChatHistoryProps) {
  const { isAuthenticated, user } = useAuth();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadChatSessions();
    }
  }, [user]);

  const loadChatSessions = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Get the auth token from localStorage/cookies
      const token = localStorage.getItem('legalynx_token'); // or wherever you store it
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      // Add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/backend/api/chat-sessions?userId=${user.id}`, {
        headers
      });
      
      if (response.ok) {
        const sessions = await response.json();
        const formattedSessions = sessions.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setChatSessions(formattedSessions);
      } else {
        throw new Error('Failed to load chat sessions');
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      setError('Failed to load chat history');
      setChatSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionSelect = async (sessionId: string, documentId: string) => {
    setSelectedSession(sessionId);
    
    try {
      // Get the session with messages
      const session = chatSessions.find(s => s.id === sessionId);
      if (session) {
        // Save current session messages to a temporary storage for the ChatViewer to pick up
        // This is a bridge until we fully integrate session switching in ChatViewer
        const chatHistoryKey = `rag_chat_history_${user?.id}`;
        localStorage.setItem(chatHistoryKey, JSON.stringify(session.messages));
        
        // Select the document
        onDocumentSelect?.(documentId);
        
        toast.success(`Loaded chat session: ${session.title || 'Untitled'}`);
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
      toast.error('Failed to load session');
    }
  };

  const handleDeleteSession = async (sessionId: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this chat session? This action cannot be undone.')) {
      return;
    }

    try {
      // Get the auth token
      const token = localStorage.getItem('legalynx_token');
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/backend/api/chat-sessions/${sessionId}`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        // Remove from local state
        setChatSessions(prev => prev.filter(session => session.id !== sessionId));
        
        if (selectedSession === sessionId) {
          setSelectedSession(null);
        }
        
        toast.success('Chat session deleted successfully');
      } else {
        throw new Error('Failed to delete session');
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast.error('Failed to delete chat session');
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
    const lastAssistantMessage = [...session.messages]
      .reverse()
      .find(m => m.type === 'assistant');
    
    return lastAssistantMessage 
      ? lastAssistantMessage.content 
      : session.messages.length > 0 
        ? session.messages[session.messages.length - 1].content
        : 'No messages yet';
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
        <div className="flex items-center text-sm text-gray-600">
          <MessageSquare className="w-4 h-4 mr-1" />
          {chatSessions.length} session{chatSessions.length !== 1 ? 's' : ''}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          <AlertCircle className="w-5 h-5 inline mr-2" />
          {error}
        </div>
      )}

      {!user ? (
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
            <div className="col-span-2">Document</div>
            <div className="col-span-3">Last Message</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-1">Actions</div>
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
                        {session.messages.length} messages
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
                <div className="col-span-2 flex items-center">
                  <FileText className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                  <p className="text-sm text-gray-600 truncate">{session.document.originalName}</p>
                </div>

                {/* Last Message */}
                <div className="col-span-3 flex items-center text-sm text-gray-600">
                  <p className="truncate">{truncateText(getLastMessage(session), 60)}</p>
                </div>

                {/* Date */}
                <div className="col-span-2 flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-1" />
                  <div className="min-w-0">
                    <p className="truncate">{formatDate(session.updatedAt)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-1 flex items-center justify-end">
                  <button 
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
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