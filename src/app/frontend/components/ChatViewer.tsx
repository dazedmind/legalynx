// Updated ChatViewer.tsx with proper refactoring
'use client';

import React, { useState, useEffect } from 'react';
import { FileText, AlertCircle, Plus, ArrowUp, Zap, Cloud } from 'lucide-react';
import { apiService, handleApiError, AnalysisResponse, RerankDemo, UploadResponse } from '../lib/api';
import { toast, Toaster } from 'sonner';
import { useAuth } from '@/lib/context/AuthContext';
import { authUtils } from '@/lib/auth';
import { GoDownload } from 'react-icons/go';
import UploadPage from './UploadPage';
import { useRAGCache } from '@/lib/ragCacheService';
import ConfirmationModal from './ConfirmationModal';
import { ChatContainer } from './ChatContainer';

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
  resetToUpload?: boolean;
}

export default function ChatViewer({ 
  isSystemReady, 
  onUploadSuccess, 
  selectedSessionId, 
  resetToUpload 
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
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  // const confirmationModalConfig = {
  //   header: 'Start New Chat',
  //   message: 'Are you sure you want to discard all changes and start a new chat?',
  //   trueButton: 'Discard Changes',
  //   falseButton: 'Cancel',
  // };
  
  // Chat states
  const [query, setQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaveTimestamp, setLastSaveTimestamp] = useState(Date.now());

  // RAG cache status display
  const [showCacheStats, setShowCacheStats] = useState(false);

  // Modal state for confirmation
  const [confirmationModalConfig, setConfirmationModalConfig] = useState<{
    header: string;
    message: string;
    trueButton: string;
    falseButton: string;
    onConfirm: () => void;
  } | null>(null);

  // Handler to open confirmation modal
  const openConfirmationModal = (
    config: { header: string; message: string; trueButton: string; falseButton: string; },
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
    handleNewChat();
    if (resetToUpload) {
      console.log('🔄 Resetting ChatViewer to upload state');
      handleNewChat();
    }
  }, [resetToUpload]);

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
                filename: mostRecent.filename,
                originalName: mostRecent.originalName,
                size: mostRecent.size,
                uploadedAt: mostRecent.uploadedAt,
                pages: mostRecent.pageCount,
                status: mostRecent.status,
                databaseId: mostRecent.id
              };
              
              console.log('📄 Loading document from API:', documentInfo.originalName);
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
            const sortedDocs = docs.sort((a: any, b: any) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
            console.log('📄 Loading document from localStorage:', sortedDocs[0].originalName);
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

  // Enhanced loadSpecificSession with RAG caching
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
    console.log('🔄 Loading specific session:', sessionId);
    
    try {
      const response = await fetch(`/backend/api/chat/${sessionId}/messages`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const sessionData = await response.json();
        console.log('📄 Session data loaded:', sessionData);
        
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
          originalName: sessionData.document.name,
          size: sessionData.document.size,
          pages: sessionData.document.pages,
          status: sessionData.document.status,
          uploadedAt: new Date().toISOString(),
          databaseId: sessionData.document.id
        };
        
        console.log('📁 Document info:', documentInfo);
        
        // FIXED: Properly load PDF into RAG system
        try {
          console.log('📤 Loading PDF into RAG system...');
          await loadPdfIntoRagSystemCached(sessionData.document.id, documentInfo.originalName);
        } catch (pdfError) {
          console.error('❌ Failed to load PDF:', pdfError);
          
          const errorMessage = pdfError instanceof Error ? pdfError.message : 'Unknown error';
          
          if (errorMessage.includes('not found') || errorMessage.includes('404')) {
            setDocumentExists(false);
          }
        }
        
        setCurrentDocument(documentInfo);
        
        const formattedMessages: ChatMessage[] = sessionData.messages.map((msg: any) => ({
          id: msg.id,
          type: msg.role,
          content: msg.content,
          createdAt: new Date(msg.createdAt),
          sourceCount: msg.tokensUsed
        }));
        
        setChatHistory(formattedMessages);
        
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
      setDocumentExists(false);
    }
  };

  const loadOrCreateSession = async () => {
    if (!user || !currentDocument || isCreatingSession || !documentExists) return;
  
    try {
      setIsCreatingSession(true);
      const documentId = currentDocument.databaseId || currentDocument.id;
      
      const exists = await checkDocumentExists(documentId);
      if (!exists) {
        console.log('Document no longer exists, cannot create session');
        setDocumentExists(false);
        handleDocumentDeleted();
        return;
      }
      
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
        console.log('Error loading/creating session, document may be deleted');
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
  
  const createNewSession = async (documentId?: string) => {
    if (!user || !currentDocument || isCreatingSession || !documentExists) return;
    
    if (!currentDocument.databaseId) {
      toast.error('Document is not saved to your account');
      return;
    }
    
    try {
      setIsCreatingSession(true);
      const useDocumentId = documentId || currentDocument.databaseId || currentDocument.id;
      
      const exists = await checkDocumentExists(useDocumentId);
      if (!exists) {
        setDocumentExists(false);
        handleDocumentDeleted();
        return;
      }
      
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
      } else if (response.status === 404) {
        setDocumentExists(false);
        handleDocumentDeleted();
      } else {
        throw new Error('Failed to create session');
      }
    } catch (error) {
      console.error('Failed to create session:', error);
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

  useEffect(() => {
    if (hasUnsavedChanges && 
        chatHistory.length > 0 && 
        currentSessionId && 
        user && 
        !isSaving &&
        documentExists &&
        Date.now() - lastSaveTimestamp > 2000) {
      
      console.log('Auto-saving session due to changes...');
      
      const timeoutId = setTimeout(() => {
        saveSessionToDatabase();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [hasUnsavedChanges, currentSessionId, user, isSaving, lastSaveTimestamp, chatHistory.length, documentExists]);
  
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

    setChatHistory(prev => [...prev, newMessage]);
    setHasUnsavedChanges(true);

    if (currentSessionId && typeof currentSessionId === 'string' && currentSessionId.trim() !== '') {
      try {
        console.log('Saving message to database:', newMessage.content.substring(0, 50));
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
        } else if (response.status === 404) {
          console.log('Session not found, document may have been deleted');
          setDocumentExists(false);
          handleDocumentDeleted();
        } else {
          const errorData = await response.json();
          console.error('Failed to save message:', errorData);
        }
      } catch (error) {
        console.error('Failed to save message to database:', error);
      }
    } else {
      console.warn('Cannot save message - invalid session ID:', currentSessionId);
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
      const result = await apiService.queryDocuments(userMessage.content);
      
      await addMessage({
        type: 'ASSISTANT',
        content: result.response,
        query: userMessage.content,
        sourceCount: result.source_count
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
      filename: '',
      originalName: '',
      size: 0,
      uploadedAt: '',
      pages_processed: 0
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

  // The actual new chat logic
  const handleNewChat = async () => {
    try {
      setCurrentSessionId(null);
      setChatHistory([]);
      setCurrentDocument(null);
      setQuery('');
      setError('');
      setDocumentExists(false);
      setIsLoadingSession(false);
      setLoadingSessionId(null);
      toast.dismiss();
      await apiService.resetSystem();
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
    } finally {
      setIsResetting(false);
    }
  };

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
          document_id: currentDocument.id,
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
        handleNewChat();
      } else {
        toast.error(error.message || 'Failed to save file to account');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadSuccess = (response: UploadResponse) => {
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
    setDocumentExists(true);
    
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

  // Get cache status for current document
  const getCacheStatus = () => {
    if (!currentDocument) return null;
    return ragCache.getCached(currentDocument.id);
  };

  const cacheStatus = getCacheStatus();
  const cacheStats = ragCache.getStats();

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
                  <h3 className={`font-semibold ${documentExists ? 'text-gray-900' : 'text-gray-500'}`}>
                    {currentDocument.originalName}
                    {!documentExists && ' (Document Deleted)'}
                  </h3>
                  {/* RAG Cache Status Indicator */}
                  {documentExists && cacheStatus && (
                    <div className="flex items-center">
                      <Zap className={`w-4 h-4 ml-2 ${
                        cacheStatus.status === 'loaded' ? 'text-green-500' : 
                        cacheStatus.status === 'loading' ? 'text-yellow-500' : 'text-red-500'
                      }`} />
                      <span className={`text-xs ml-1 ${
                        cacheStatus.status === 'loaded' ? 'text-green-600' : 
                        cacheStatus.status === 'loading' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {cacheStatus.status === 'loaded' ? 'Cached' : 
                         cacheStatus.status === 'loading' ? 'Loading...' : 'Error'}
                      </span>
                    </div>
                  )}
                </div>
                <p className={`text-sm ${documentExists ? 'text-gray-600' : 'text-red-600'}`}>
                  {documentExists ? (
                    <>
                      {currentDocument.pages} pages • {formatFileSize(currentDocument.size)} • 
                      Uploaded {new Date(currentDocument.uploadedAt).toLocaleDateString()}
                      {currentSessionId && currentDocument.status === 'INDEXED' ? (
                        <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
                          Session Saved
                        </span>
                      ):(
                        <span className="ml-2 px-2 py-1 text-xs bg-neutral-100 text-neutral-800 border-neutral-300 border-dashed border-2 rounded-full font-medium">
                          Temporary Session
                        </span>
                      )}
                    </>
                  ) : (
                    'Document no longer available. Please upload a new document.'
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex space-x-2">
                <button 
                  onClick={() => openConfirmationModal(
                    {
                      header: 'Save to Account',
                      message: 'Save this document to your account for permanent access across all your devices. The document will be securely stored in cloud storage.',
                      trueButton: 'Save File',
                      falseButton: 'Cancel',
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
                  <Cloud className="w-4 h-4 mr-1" />
                  {!documentExists 
                    ? 'Unavailable'
                    : currentDocument?.status === 'INDEXED' 
                      ? 'Saved' 
                      : 'Save File'
                  }
                </button>

                <button 
                  onClick={() => openConfirmationModal(
                    {
                      header: 'Start New Chat',
                      message: 'Are you sure you want to discard all changes and start a new chat?',
                      trueButton: 'Discard Changes',
                      falseButton: 'Cancel',
                    },
                    handleNewChat
                  )}
                  className="flex items-center cursor-pointer p-2 px-3 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all duration-300"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  New Chat
                </button>
              </div>
            </div>
          </div>  
        ) : null}
      
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!currentDocument ? (
          <div className="flex-1 flex flex-col justify-center p-8 max-w-2xl mx-auto w-full">
            <UploadPage onUploadSuccess={handleUploadSuccess} />
          </div>
        ) : (
          <>
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

            {/* Input Area */}
            <div className="flex-shrink-0 bg-white border-t border-gray-200 p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  {error}
                </div>
              )}

              {documentExists && (
                <>
                  <div className='flex gap-4 mx-auto w-full relative'>
                    <div className="flex-1">
                      <textarea
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask a question about the uploaded document..."
                        rows={2}
                        className="w-full px-3 py-2 h-16 border border-gray-300 rounded-md focus:outline-none resize-none"
                      />
                    </div>

                    <button
                      onClick={() => handleQuery()}
                      disabled={isQuerying || !query.trim() || !documentExists}
                      className="flex items-center absolute right-5 top-1/2 -translate-y-1/2 cursor-pointer p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed h-fit"
                    >
                      {isQuerying ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <ArrowUp className="w-6 h-6" />
                      )}
                    </button>
                  </div>

                  <div className="mt-2 text-xs text-gray-500 text-center">
                    Press Enter to send, Shift+Enter for new line
                  </div>
                </>
              )}

              {!documentExists && (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 mb-3">
                    This document is no longer available. You can view the chat history above.
                  </p>
                  <button
                    onClick={handleNewChat}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Upload New Document
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Confirmation Modal for New Chat and Save File */}
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
            }}
          />
        )}
      </div>
      <Toaster />
    </div>
  );
}