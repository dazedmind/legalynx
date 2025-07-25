// Updated ChatViewer.tsx with SessionLoader integration
'use client';

import React, { useState, useEffect } from 'react';
import { FileText, AlertCircle, Plus, ArrowUp, Cloud } from 'lucide-react';
import { apiService, handleApiError, UploadResponse, isSecurityError, getSecurityErrorMessage } from '../lib/api';
import { toast, Toaster } from 'sonner';
import { useAuth } from '@/lib/context/AuthContext';
import { authUtils } from '@/lib/auth';
import { useRAGCache } from '@/lib/ragCacheService';
import ConfirmationModal from './ConfirmationModal';
import { ChatContainer } from './ChatContainer';
import SessionLoader from './SessionLoader'; // Import the new loader
import { CloudCheck, AudioLines } from 'lucide-react';
import { ModalType } from './ConfirmationModal';
import VoiceChatComponent from './VoiceChatComponent';

interface ChatMessage {
  id: string;
  type: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: Date;
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
}

interface SavedChatSession {
  id: string;
  title: string;
  documentId: string;
  documentName: string;
  messageCount: number;
}

interface CombinedComponentProps {
  isSystemReady: boolean;
  onUploadSuccess: (response: UploadResponse) => void;
  onSessionDelete?: (sessionId: string) => void;
  selectedSessionId?: string;
  handleNewChat?: () => void;
  handleVoiceChat?: () => void;
  currentDocumentId?: string;
}

// Add loading stage type
type LoadingStage = 'loading_session' | 'loading_document' | 'loading_rag' | 'preparing_chat';

export default function ChatViewer({ 
  isSystemReady, 
  onUploadSuccess, 
  onSessionDelete,
  selectedSessionId, 
  handleNewChat,
  handleVoiceChat,
  currentDocumentId
}: CombinedComponentProps) {
  const { isAuthenticated, user } = useAuth();
  const ragCache = useRAGCache();
  
  // Document and session states
  const [currentDocument, setCurrentDocument] = useState<any>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [documentExists, setDocumentExists] = useState(true);
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [savedSessions, setSavedSessions] = useState<SavedChatSession[]>([]);
  const [isVoiceChat, setIsVoiceChat] = useState(false);

  // ✅ NEW: Loading stage tracking
  const [loadingStage, setLoadingStage] = useState<LoadingStage>('loading_session');
  const [loadingSessionInfo, setLoadingSessionInfo] = useState<{
    title?: string;
    documentName?: string;
  }>({});
  
  // Chat states
  const [query, setQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaveTimestamp, setLastSaveTimestamp] = useState(Date.now());

  // Modal state for confirmation
  const [confirmationModalConfig, setConfirmationModalConfig] = useState<{
    header: string;
    message: string;
    trueButton: string;
    falseButton: string;
    type: string;
    onConfirm: () => void;
  } | null>(null);

  // Handler to open confirmation modal
  const openConfirmationModal = (
    config: { header: string; message: string; trueButton: string; falseButton: string; type: string; },
    onConfirm: () => void
  ) => {
    setConfirmationModalConfig({ ...config, onConfirm });
  };

  // Handler for modal action
  const handleConfirmationModal = (shouldProceed: boolean) => {
    if (shouldProceed && confirmationModalConfig?.onConfirm) {
      confirmationModalConfig.onConfirm();
    }
    setConfirmationModalConfig(null);
  };

  useEffect(() => {
    // Only load document on system ready, not during reset or if already have document
    if (isSystemReady && currentDocument === null && !isResetting) {
      loadCurrentDocument();
    }
  }, [isSystemReady, user, isResetting]);

  // Enhanced useEffect for session loading with cache awareness
  useEffect(() => {
    if (isResetting) return;
    if (selectedSessionId && 
        selectedSessionId !== currentSessionId && 
        selectedSessionId !== loadingSessionId && 
        !isLoadingSession
      ) { // Don't load sessions during reset
      loadSpecificSession(selectedSessionId);
    }
  }, [selectedSessionId, currentSessionId, loadingSessionId, isLoadingSession, isResetting]);

  useEffect(() => {
    if (currentDocument && user && !currentSessionId && documentExists && !isResetting) {
      loadOrCreateSession();
    }
  }, [currentDocument, user, currentSessionId, documentExists, isResetting]);

  useEffect(() => {
    if (user && isAuthenticated && currentDocument && documentExists && !isResetting) {
      loadChatHistoryFromDatabase();
    }
  }, [user, isAuthenticated, currentDocument, documentExists, isResetting]);

  useEffect(() => {
    if (chatHistory.length > 0 && currentSessionId && user && documentExists) {
      const timeoutId = setTimeout(() => {
        saveSessionToDatabase();
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [chatHistory, currentSessionId, documentExists]);

  const getAuthHeaders = (): Record<string, string> => {
    const token = authUtils.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  };

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

  const loadCurrentDocument = async () => {
    // Don't load document if we're in a reset state or already have a document
    if (isResetting || currentDocument !== null) {
      console.log('🚫 Skipping document load - resetting or document exists');
      return;
    }
    
    try {
      if (isAuthenticated && user) {
        const response = await fetch('/backend/api/documents', {
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.documents && data.documents.length > 0) {
            const mostRecent = data.documents[0];
            const exists = await checkDocumentExists(mostRecent.id);
            
            if (exists && !isResetting) { // Double-check reset flag
              const documentInfo = {
                id: mostRecent.id,
                fileName: mostRecent.fileName,
                originalFileName: mostRecent.originalFileName,
                fileSize: mostRecent.fileSize,
                uploadedAt: mostRecent.uploadedAt,
                pageCount: mostRecent.pageCount,
                status: mostRecent.status,
                databaseId: mostRecent.id
              };
              
              console.log('📄 Loading document from API:', documentInfo.originalFileName);
              setCurrentDocument(documentInfo);
              setDocumentExists(true);
              return;
            } else {
              console.log('Most recent document no longer exists or resetting, clearing state');
              setDocumentExists(false);
            }
          }
        }
      }
      
      // Only check localStorage if we don't have a document and not resetting
      if (!currentDocument && !isResetting) {
        const storageKey = isAuthenticated && user?.id ? `uploaded_documents_${user.id}` : 'uploaded_documents';
        const savedDocs = localStorage.getItem(storageKey);
        if (savedDocs) {
          const docs = JSON.parse(savedDocs);
          if (docs.length > 0 && !isResetting) { // Check reset flag again
            const sortedDocs = docs.sort((a: any, b: any) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
            console.log('📄 Loading document from localStorage:', sortedDocs[0].original_file_name);
            setCurrentDocument(sortedDocs[0]);
            setDocumentExists(true);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load current document:', error);
      setDocumentExists(false);
    }
  };

  // ✅ Enhanced loadSpecificSession with loading stages
  const loadSpecificSession = async (sessionId: string) => {
    if (!user || isLoadingSession || loadingSessionId === sessionId) {
      console.log('🚫 Skipping session load - already loading or same session:', {
        user: !!user,
        isLoadingSession,
        loadingSessionId,
        requestedSessionId: sessionId
      });
      return;
    }

    setIsLoadingSession(true);
    setLoadingSessionId(sessionId);
    setLoadingStage('loading_session');
    console.log('🔄 Loading specific session:', sessionId);
    
    try {
      // Stage 1: Load session data
      setLoadingStage('loading_session');
      const response = await fetch(`/backend/api/chat/${sessionId}/messages`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const sessionData = await response.json();
        console.log('📄 Session data loaded:', sessionData);
        
        // Set loading info for display
        setLoadingSessionInfo({
          title: sessionData.title || `Chat with ${sessionData.document.name}`,
          documentName: sessionData.document.name
        });
        
        // Stage 2: Check document exists
        setLoadingStage('loading_document');
        const docExists = await checkDocumentExists(sessionData.document.id);
        
        if (!docExists) {
          setDocumentExists(false);
          setCurrentDocument(null);
          setCurrentSessionId(null);
          setChatHistory([]);
          return;
        }
        
        setCurrentSessionId(sessionData.sessionId);
        setDocumentExists(true);
        
        const documentInfo = {
          id: sessionData.document.id,
          fileName: sessionData.document.fileName,
          originalFileName: sessionData.document.originalFileName,
          fileSize: sessionData.document.fileSize,
          pageCount: sessionData.document.pageCount,
          status: sessionData.document.status,
          uploadedAt: new Date().toISOString(),
          databaseId: sessionData.document.id
        };
        
        console.log('📁 Document info:', documentInfo);
        
        // Stage 3: Load PDF into RAG system
        setLoadingStage('loading_rag');
        try {
          console.log('📤 Loading PDF into RAG system...');
          await loadPdfIntoRagSystemCached(sessionData.document.id, documentInfo.originalFileName);
        } catch (pdfError) {
          console.error('❌ Failed to load PDF:', pdfError);
          
          const errorMessage = pdfError instanceof Error ? pdfError.message : 'Unknown error';
          
          if (errorMessage.includes('not found') || errorMessage.includes('404')) {
            setDocumentExists(false);
          }
        }
        
        // Stage 4: Prepare chat interface
        setLoadingStage('preparing_chat');
        setCurrentDocument(documentInfo);
        
        const formattedMessages: ChatMessage[] = sessionData.messages.map((msg: any) => ({
          id: msg.id,
          type: msg.role?.toUpperCase() as 'USER' | 'ASSISTANT',
          content: msg.content,
          created_at: new Date(msg.created_at), 
          source_count: msg.tokens_used
        }));
        
        setChatHistory(formattedMessages);
        
        // Small delay to show the final stage
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } else if (response.status === 401) {
        toast.error('Authentication failed. Please sign in again.', { 
          id: `loading-session-${sessionId}` 
        });
      } else if (response.status === 404) {
        toast.error('Chat session not found.', { 
          id: `loading-session-${sessionId}` 
        });
        handleDocumentDeleted();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load session');
      }
    } catch (error) {
      console.error('❌ Failed to load specific session:', error);
      toast.error('Failed to load chat session', {
        id: `loading-session-${sessionId}`
      });
      handleDocumentDeleted();
    } finally {
      setIsLoadingSession(false);
      setLoadingSessionId(null);
      setLoadingSessionInfo({});
    }
  };

  // New cached RAG loading function
  const loadPdfIntoRagSystemCached = async (documentId: string, filename: string): Promise<void> => {
    // Define file blob getter
    const getFileBlob = async (): Promise<Blob> => {
      const exists = await checkDocumentExists(documentId);
      if (!exists) {
        throw new Error('Document no longer exists in database');
      }
      
      const documentResponse = await fetch(`/backend/api/documents/${documentId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!documentResponse.ok) {
        if (documentResponse.status === 404) {
          throw new Error('Document not found');
        }
        const errorData = await documentResponse.json();
        throw new Error(errorData.error || 'Failed to get document details');
      }
      
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
      
      return fileResponse.blob();
    };

    // Use cached loading
    await ragCache.loadDocument(documentId, filename, getFileBlob);
  };

  const loadChatHistoryFromDatabase = async () => {
    if (!user || !isAuthenticated || !currentDocument || !documentExists) return;

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
          
          const exists = await checkDocumentExists(currentDocument.id);
          if (!exists) {
            console.log('Document for session no longer exists');
            setDocumentExists(false);
            handleDocumentDeleted();
            return;
          }
          
          setCurrentSessionId(mostRecentSession.id);
          
          const messagesResponse = await fetch(
            `/backend/api/chat-messages?sessionId=${mostRecentSession.id}`,
            { headers: getAuthHeaders() }
          );
          
          if (messagesResponse.ok) {
            const messages = await messagesResponse.json();
            const formattedMessages = messages.map((msg: any) => ({
              id: msg.id,
              type: msg.role?.toUpperCase() as 'USER' | 'ASSISTANT',
              content: msg.content,
              created_at: new Date(msg.created_at || msg.timestamp)
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
      setDocumentExists(false);
    }
  };

  const addMessage = async (message: Omit<ChatMessage, 'id' | 'createdAt'>) => {
    if (!documentExists) {
      console.warn('Cannot add message - document does not exist');
      return;
    }
  
    const newMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };
  
    // Add to local state immediately for UI responsiveness
    setChatHistory(prev => [...prev, newMessage]);
    setHasUnsavedChanges(true);
  
    // ✅ FIX: Ensure we have a session before saving the message
    let sessionId = currentSessionId;
    
    // If no session exists, create one first
    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim() === '') {
      console.log('No session found, creating new session before saving message...');
      
      if (!user || !currentDocument) {
        console.error('Cannot create session - missing user or document');
        return;
      }
  
      try {
        const documentId = currentDocument.databaseId || currentDocument.id;
        
        // Create new session
        const sessionResponse = await fetch('/backend/api/chat-sessions', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            userId: user.id,
            documentId: documentId,
            title: `Chat with ${currentDocument.originalName}`,
            isSaved: false
          })
        });
  
        if (sessionResponse.ok) {
          const newSession = await sessionResponse.json();
          sessionId = newSession.id;
          setCurrentSessionId(sessionId);
          console.log('✅ New session created:', sessionId);
        } else {
          console.error('Failed to create session:', await sessionResponse.text());
          return;
        }
      } catch (error) {
        console.error('Failed to create session:', error);
        return;
      }
    }
  
    // Now save the message to the session
    try {
      console.log('💾 Saving message to session:', sessionId);
      
      const response = await fetch('/backend/api/chat-messages', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: newMessage.id,
          sessionId: sessionId,
          role: newMessage.type.toUpperCase(), // Maps to database 'role' field
          content: newMessage.content,
          timestamp: newMessage.createdAt.toISOString(), // Maps to 'created_at'
          tokens_used: 0
        })
      });
  
      if (response.ok) {
        const savedMessage = await response.json();
        console.log('✅ Message saved successfully:', savedMessage.id);
        
        // Reset unsaved changes flag
        setHasUnsavedChanges(false);
        setLastSaveTimestamp(Date.now());
      } else if (response.status === 404) {
        console.log('❌ Session not found, document may have been deleted');
        setDocumentExists(false);
        handleDocumentDeleted();
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to save message:', errorData);
        
        // Show user-friendly error
        if (errorData.error?.includes('Invalid role')) {
          console.error('Invalid message type:', newMessage.type);
        }
      }
    } catch (error) {
      console.error('❌ Network error saving message:', error);
    }
  };
  

// ✅ IMPROVED: Better session loading/creation workflow
const loadOrCreateSession = async () => {
  if (!user || !currentDocument || isCreatingSession || !documentExists) return;

  try {
    setIsCreatingSession(true);
    const documentId = currentDocument.databaseId || currentDocument.id;
    
    console.log('🔍 Looking for existing session for document:', documentId);
    
    // Check if document still exists
    const exists = await checkDocumentExists(documentId);
    if (!exists) {
      console.log('❌ Document no longer exists');
      setDocumentExists(false);
      handleDocumentDeleted();
      return;
    }
    
    // Try to find existing session
    const response = await fetch(
      `/backend/api/chat-sessions/find?userId=${user.id}&documentId=${documentId}`,
      { headers: getAuthHeaders() }
    );
    
    if (response.ok) {
      // Existing session found
      const session = await response.json();
      console.log('✅ Found existing session:', session.id);
      setCurrentSessionId(session.id);
      
      // Load existing messages
      try {
        const messagesResponse = await fetch(
          `/backend/api/chat/${session.id}/messages`,
          { headers: getAuthHeaders() }
        );
        
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          const messages = messagesData.messages || [];
          
          // Transform messages to match frontend format
          const formattedMessages = messages.map((msg: any) => ({
            id: msg.id,
            type: msg.role.toLowerCase(), // Convert from DATABASE: USER/ASSISTANT -> FRONTEND: user/assistant
            content: msg.content,
            createdAt: new Date(msg.createdAt || msg.created_at),
            sourceNodes: msg.sourceNodes || msg.source_nodes,
            tokensUsed: msg.tokensUsed || msg.tokens_used
          }));
          
          setChatHistory(formattedMessages);
          console.log(`📚 Loaded ${formattedMessages.length} existing messages`);
        }
      } catch (messageError) {
        console.error('Failed to load messages:', messageError);
      }
      
    } else if (response.status === 404) {
      // No existing session - this is fine, we'll create one when first message is sent
      console.log('📝 No existing session found - will create when first message is sent');
      setCurrentSessionId(null);
      setChatHistory([]);
      
    } else {
      console.error('Error checking for session:', await response.text());
      handleDocumentDeleted();
    }
    
  } catch (error) {
    console.error('Failed to load or create session:', error);
    setDocumentExists(false);
    handleDocumentDeleted();
  } finally {
    setIsCreatingSession(false);
  }
};
  
 // ✅ IMPROVED: Explicit session creation function
const createNewSession = async (documentId?: string) => {
  if (!user || !currentDocument || isCreatingSession || !documentExists) return;
  
  if (!currentDocument.databaseId) {
    toast.error('Document is not saved to your account');
    return;
  }
  
  try {
    setIsCreatingSession(true);
    const useDocumentId = documentId || currentDocument.databaseId || currentDocument.id;
    
    console.log('🆕 Creating new session for document:', useDocumentId);
    
    // Verify document exists
    const exists = await checkDocumentExists(useDocumentId);
    if (!exists) {
      setDocumentExists(false);
      handleDocumentDeleted();
      return;
    }
    
    // Create new session
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
      console.log('✅ New chat session created:', session.id);
      toast.success('New chat session started');
    } else if (response.status === 404) {
      setDocumentExists(false);
      handleDocumentDeleted();
    } else {
      const errorText = await response.text();
      console.error('Failed to create session:', errorText);
      throw new Error('Failed to create session');
    }
  } catch (error) {
    console.error('Failed to create session:', error);
    toast.error('Failed to create new chat session');
    setDocumentExists(false);
    handleDocumentDeleted();
  } finally {
    setIsCreatingSession(false);
  }
};

  const saveSessionToDatabase = async () => {
    if (!currentSessionId || !user || chatHistory.length === 0 || !documentExists) {
      console.log('Skipping save - missing requirements:', {
        currentSessionId: !!currentSessionId,
        user: !!user,
        chatHistoryLength: chatHistory.length,
        documentExists
      });
      return;
    }

    if (typeof currentSessionId !== 'string' || currentSessionId.trim() === '') {
      console.error('Invalid session ID:', currentSessionId);
      return;
    }

    try {
      setIsSaving(true);
      
      const firstUserMessage = chatHistory.find(m => m.type === 'USER');
      const title = firstUserMessage 
        ? `${firstUserMessage.content.substring(0, 50)}${firstUserMessage.content.length > 50 ? '...' : ''}`
        : `Chat with ${currentDocument?.originalName || 'Document'}`;

      console.log('Saving session:', {
        sessionId: currentSessionId,
        title,
        messageCount: chatHistory.length
      });

      const response = await fetch(`/backend/api/chat-sessions/${currentSessionId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title,
          updatedAt: new Date().toISOString(),
          isSaved: true
        })
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('Session no longer exists, document may have been deleted');
          setDocumentExists(false);
          handleDocumentDeleted();
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save session');
      }

      const result = await response.json();
      console.log('Session saved successfully:', result);
      
      setHasUnsavedChanges(false);
      setLastSaveTimestamp(Date.now());

    } catch (error) {
      console.error('Failed to save session to database:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        setDocumentExists(false);
        handleDocumentDeleted();
      }
    } finally {
      setIsSaving(false);
    }
  };


  const handleMessageAction = (action: string, messageId: string, content?: string) => {
    switch (action) {
      case 'copy':
        toast.success('Message copied to clipboard');
        break;
      case 'thumbsUp':
        console.log('Thumbs up for message:', messageId);
        toast.success('Thanks for the feedback!');
        break;
      case 'thumbsDown':
        console.log('Thumbs down for message:', messageId);
        toast.info('Thanks for the feedback. We\'ll work to improve.');
        break;
      case 'regenerate':
        console.log('Regenerating message:', messageId);
        handleRegenerateResponse(messageId);
        break;
      default:
        break;
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!sessionId) return;
        
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
    }
  };

  const handleRegenerateResponse = async (messageId: string) => {
    // Find the message and its corresponding user query
    const messageIndex = chatHistory.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;

    const assistantMessage = chatHistory[messageIndex];
    if (assistantMessage.type !== 'ASSISTANT') return;

    // Find the user message that preceded this assistant message
    const userMessage = chatHistory[messageIndex - 1];
    if (!userMessage || userMessage.type !== 'USER') return;

    try {
      setIsQuerying(true);
      
      // Remove the assistant message we're regenerating
      setChatHistory(prev => prev.filter(msg => msg.id !== messageId));
      
      // Re-run the query
      const result = await apiService.queryDocuments(userMessage.content + "Be more specific and detailed in your response.");
      
      await addMessage({
        type: 'ASSISTANT',
        content: result.response,
        query: userMessage.content,
        sourceCount: result.sourceCount
      });
      
      toast.success('Response regenerated');
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      toast.error('Failed to regenerate response');
    } finally {
      setIsQuerying(false);
    }
  };
  
  const handleDocumentDeleted = () => {
    console.log('🗑️ Handling document deletion - resetting to upload state');
    
    setCurrentSessionId(null);
    setChatHistory([]);
    setCurrentDocument(null);
    setQuery('');
    setError('');
    setDocumentExists(false);
    setIsLoadingSession(false);
    setLoadingSessionId(null);
    
    toast.dismiss();
    
    onUploadSuccess({
      documentId: '',
      fileName: '',
      originalFileName: '',
      fileSize: 0,
      uploadedAt: '',
      pageCount: 0,
      mimeType: '',
      conversionPerformed: false
    });
  };

  const handleQuery = async (queryText?: string) => {
    const currentQuery = queryText || query;
    
    if (!currentQuery.trim()) {
        setError('Please enter a query');
        return;
    }

    if (!documentExists) {
        setError('Document no longer exists. Cannot process queries.');
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

    try {
        const result = await apiService.queryDocuments(currentQuery);
        
        // Check for security feedback
        let assistantMessage = result.response;
        let securityNotice = '';
        
        if (result.securityStatus === 'sanitized') {
            securityNotice = '\n\n⚠️ Note: Your query was modified for security reasons.';
            toast.warning('Your query was modified for security reasons');
        }
        
        await addMessage({
            type: 'ASSISTANT',
            content: assistantMessage + securityNotice,
            query: currentQuery,
              sourceCount: result.sourceCount
        });
        
    } catch (error) {
        console.error('Query error:', error);
        
        // Handle security errors specifically
        if (isSecurityError(error)) {
            const securityErrorMessage = getSecurityErrorMessage(error);
            setError(securityErrorMessage);
            
            let userFriendlyMessage = '';
            let assistantResponse = '';
            
            switch (error.type) {
                case 'rate_limit':
                    userFriendlyMessage = 'Query limit reached. Please wait before asking another question.';
                    assistantResponse = '⏱️ I\'m temporarily unavailable due to rate limiting. Please wait a moment before asking your next question.';
                    toast.error('Query rate limit exceeded');
                    break;
                    
                case 'injection':
                    userFriendlyMessage = 'Query blocked: Please rephrase your question using normal language.';
                    assistantResponse = '🛡️ I detected potentially harmful content in your query. Please rephrase your question using normal, conversational language and I\'ll be happy to help.';
                    toast.warning('Query was blocked for security reasons');
                    break;
                    
                default:
                    userFriendlyMessage = securityErrorMessage;
                    assistantResponse = `🔒 Security Error: ${securityErrorMessage}`;
                    toast.error('Security error occurred');
            }
            
            await addMessage({
                type: 'ASSISTANT',
                content: assistantResponse,
                query: currentQuery
            });
            
        } else {
            // Handle regular API errors
            const errorMessage = handleApiError(error);
            setError(errorMessage);
            
            await addMessage({
                type: 'ASSISTANT',
                content: `❌ Sorry, I encountered an error: ${errorMessage}`,
                query: currentQuery
            });
            
            toast.error('Query failed: ' + errorMessage);
        }
    } finally {
        setIsQuerying(false);
    }
};

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleQuery();
    }
  };

  const handleManualInput = () => {
    loadOrCreateSession();
    setChatHistory([]);
    setIsVoiceChat(false);
  }

  // Get cache status for current document
  const getCacheStatus = () => {
    if (!currentDocument) return null;
    return ragCache.getCached(currentDocument.id);
  };

  const cacheStatus = getCacheStatus();
  const cacheStats = ragCache.getStats();


  const handleSaveFile = async () => {
    if (!currentDocument || !isAuthenticated || !user || !documentExists) {
      toast.error('No document to save, user not authenticated, or document no longer exists');
      return;
    }

    const documentStatus = currentDocument.status;
    
    console.log('📄 Document status check:', {
      originalStatus: currentDocument.status,
      documentId: currentDocument.id,
      documentStatus: documentStatus,
      exists: documentExists
    });

    if (documentStatus === 'INDEXED') {
      toast.info('Document is already saved to your account');
      return;
    }

    const savableStatuses = ['TEMPORARY', 'READY', 'UPLOADED'];

    if (!savableStatuses.includes(documentStatus)) {
      toast.error(`Cannot save document with status: ${currentDocument.status}. Only temporary documents can be saved.`);
      return;
    }

    try {
      setIsSaving(true);
      
      const exists = await checkDocumentExists(currentDocument.id);
      if (!exists) {
        setDocumentExists(false);
        handleDocumentDeleted();
        return;
      }
      
      const response = await fetch('/backend/api/documents/save-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authUtils.getToken()}`,
        },
        body: JSON.stringify({
          documentId: currentDocument.id,
          title: currentDocument.originalName || 'Untitled',
        }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          setDocumentExists(false);
          handleDocumentDeleted();
          return;
        }
        
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save document');
      }

      const savedDocumentInfo = await response.json();
      
      setCurrentDocument({
        ...currentDocument,
        status: 'INDEXED',
        s3Key: savedDocumentInfo.s3Key,
        s3Url: savedDocumentInfo.s3Url
      });
      
      setIsSaveModalOpen(false);
      toast.success('Document saved to your account and cloud storage!');
      
    } catch (error: any) {
      console.error('Failed to save file:', error);
      
      if (error.message.includes('Temporary file not found') || 
          error.message.includes('no longer available') ||
          error.message.includes('not found')) {
        toast.error('Document file expired or was deleted. Please re-upload the document.');
        setDocumentExists(false);
        if (handleNewChat) {
          handleNewChat();
        }
      } else {
        toast.error(error.message || 'Failed to save file to account');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ Show SessionLoader when loading a session
  if (isLoadingSession && loadingSessionId) {
    return (
      <SessionLoader
        sessionTitle={loadingSessionInfo.title}
        documentName={loadingSessionInfo.documentName}
        stage={loadingStage}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Fixed Document Header */}
      <div className="flex-shrink-0 bg-white p-4">
        {currentDocument ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!documentExists && (
                <AlertCircle className="w-6 h-6 text-red-500" />
              )}
              <FileText className={`w-6 h-6 ${documentExists ? 'text-blue-600' : 'text-gray-400'}`} />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className={`text-sm md:text-base font-semibold ${documentExists ? 'text-gray-900' : 'text-gray-500'}`}>
                    {currentDocument.originalFileName}
                    {!documentExists && ' (Document Deleted)'}
                  </h3>
                </div>
                <p className={`text-sm ${documentExists ? 'text-gray-600' : 'text-red-600'}`}>
                  {documentExists ? (
                    <span className="flex items-center gap-2">
                      <span className="hidden md:block">
                        {currentDocument.pageCount} pages • Document loaded
                      </span>
                      {currentSessionId && currentDocument.status === 'INDEXED' ? (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
                          Session Saved
                        </span>
                      ):(
                        <span className="px-2 py-1 text-xs bg-neutral-100 text-neutral-800 border-neutral-300 border-dashed border-2 rounded-full font-medium">
                          Temporary Session
                        </span>
                      )}
                    </span>
                  ) : (
                    'Document no longer available. Please upload a new document.'
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
            <button 
                  onClick={() => openConfirmationModal(
                    {
                      header: 'Save to Account',
                      message: 'Save this document to your account for permanent access across all your devices. The document will be securely stored in cloud storage.',
                      trueButton: 'Save File',
                      falseButton: 'Cancel',
                      type: ModalType.SAVE,
                    },
                    handleSaveFile
                  )}
                  disabled={!documentExists || currentDocument?.status === 'INDEXED'}
                  className={`flex items-center p-2 px-3 text-sm rounded-lg transition-all duration-300 ${
                    !documentExists || currentDocument?.status === 'INDEXED' 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'text-black hover:brightness-105 hover:bg-yellow-200/20 hover:text-yellow-600 cursor-pointer'
                  }`}
                >
                  {!documentExists 
                    ? 'Unavailable'
                    : currentDocument?.status === 'INDEXED' 
                      ? <><CloudCheck className="w-4 h-4 mr-1" /> Saved</>
                      : <><Cloud className="w-4 h-4 mr-1" /> Save File</>
                  }
                </button>
                
              <button 
                onClick={currentDocument.status === 'TEMPORARY' ? () => openConfirmationModal(
                  {
                    header: 'Unsaved Files and Session',
                    message: 'You have unsaved changes. Are you sure you want to discard all files and start a new chat?',
                    trueButton: 'Discard All',
                    falseButton: 'Cancel',
                    type: ModalType.DANGER,
                  },
                  async () => {
                    if (currentSessionId) {
                      // Delete the session first
                      await handleDeleteSession(currentSessionId);
                    }
                    if (handleNewChat) {
                      handleNewChat();
                    }
                  }
                ) : () => {if (handleNewChat) {handleNewChat()}}}
                className="flex items-center cursor-pointer p-2 px-3 gap-1 text-sm bg-gradient-to-bl from-blue-500 to-indigo-700 hover:brightness-110 transition-all duration-300 text-white rounded-lg"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden md:block">New Chat</span>
              </button>
            </div>
          </div>  
        ) : null}
      </div>
      {isVoiceChat && (
        <VoiceChatComponent
          isSystemReady={isSystemReady}
          getAuthHeaders={getAuthHeaders}
          checkDocumentExists={checkDocumentExists}
          handleDocumentDeleted={handleDocumentDeleted}
          selectedSessionId={selectedSessionId}
          onSessionCreated={handleNewChat}
          handleManualInput={handleManualInput}
          toast={toast}
        />
      )}
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
            {!documentExists && (
              <div className="flex-shrink-0 bg-red-50 border-b border-red-200 p-4">
                <div className="flex items-center text-red-700">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span className="text-sm">
                    This document no longer exists. You can view the chat history but cannot ask new questions.
                  </span>
                </div>
              </div>
            )}

            {/* Refactored Chat Messages Container */}
            <ChatContainer
              chatHistory={chatHistory}
              isQuerying={isQuerying}
              documentExists={documentExists}
              onMessageAction={handleMessageAction}
            />

            {/* Input Area - simplified */}
            <div className="flex-shrink-0 bg-white border-t border-gray-200 p-6">
              {documentExists && (
                <div className='flex gap-4 mx-auto w-full relative'>
                  <div className="flex-1">
                    <textarea
                      value={query}
                      onKeyDown={handleKeyPress}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ask a question about the uploaded document..."
                      rows={2}
                      className="w-full px-3 py-2 h-24 border border-gray-300 rounded-xl  focus:outline-none resize-none"
                    />
                  </div>
                  <button
                    onClick={() => {setIsVoiceChat(true)}}
                    // disabled={isQuerying || !query.trim() || !documentExists}
                    title="Voice Chat with Lynx AI"
                    className="flex items-center absolute right-18 top-1/2 -translate-y-1/2 cursor-pointer p-2 rounded-full bg-gradient-to-tl from-yellow to-yellow-600 text-white hover:bg-blue-700 h-fit"
                  >
                    <AudioLines className="w-6 h-6"/>
                  </button>
                  <button
                    
                    onClick={() => {handleQuery()}}
                    disabled={isQuerying || !query.trim() || !documentExists}
                    className="flex items-center absolute group right-5 top-1/2 -translate-y-1/2 cursor-pointer p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed h-fit"
                  >
                    <ArrowUp className="w-6 h-6" />
                  </button>
                </div>
              )}
            </div>
          

        {/* Confirmation Modal */}
        {confirmationModalConfig && (
          <ConfirmationModal
            isOpen={!!confirmationModalConfig}
            onClose={() => setConfirmationModalConfig(null)}
            onSave={handleConfirmationModal}
            modal={{
              header: confirmationModalConfig.header,
              message: confirmationModalConfig.message,
              trueButton: confirmationModalConfig.trueButton,
              falseButton: confirmationModalConfig.falseButton,
              type: confirmationModalConfig.type,
            }}
          />
        )}
      </div>
      <Toaster />
    </div>
  );
}