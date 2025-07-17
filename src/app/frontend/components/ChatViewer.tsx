// Fixed ChatViewer.tsx - Handles missing documents gracefully
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FileText, AlertCircle, MessageSquare, Bot, Plus, ArrowUp } from 'lucide-react';
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
  resetToUpload?: boolean;
}

export default function ChatViewer({ 
  isSystemReady, 
  onUploadSuccess, 
  selectedSessionId, 
  resetToUpload 
}: CombinedComponentProps) {
  const { isAuthenticated, user } = useAuth();
  
  // Document and session states
  const [currentDocument, setCurrentDocument] = useState<any>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [documentExists, setDocumentExists] = useState(true); // Track if current document exists

  // Chat states
  const [query, setQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [presetQueries, setPresetQueries] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>('');
  const [showPresets, setShowPresets] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaveTimestamp, setLastSaveTimestamp] = useState(Date.now());

  useEffect(() => {
    handleNewChat(); // on system load, display a new chat
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
    if (currentDocument && user && !currentSessionId && documentExists) {
      loadOrCreateSession();
    }
  }, [currentDocument, user, currentSessionId, documentExists]);

  // Load chat history from database when component mounts or user changes
  useEffect(() => {
    if (user && isAuthenticated && currentDocument && documentExists) {
      loadChatHistoryFromDatabase();
    }
  }, [user, isAuthenticated, currentDocument, documentExists]);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // Auto-save session when messages change
  useEffect(() => {
    if (chatHistory.length > 0 && currentSessionId && user && documentExists) {
      const timeoutId = setTimeout(() => {
        saveSessionToDatabase();
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [chatHistory, currentSessionId, documentExists]);

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
            
            // Check if this document still exists
            const exists = await checkDocumentExists(mostRecent.id);
            
            if (exists) {
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
              setDocumentExists(true);
              return;
            } else {
              console.log('Most recent document no longer exists, clearing state');
              setDocumentExists(false);
            }
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
          setDocumentExists(true);
        }
      }
    } catch (error) {
      console.error('Failed to load current document:', error);
      setDocumentExists(false);
    }
  };

  // Updated loadSpecificSession function with better error handling
  const loadSpecificSession = async (sessionId: string) => {
    if (!user || isLoadingSession) return;

    setIsLoadingSession(true);
    console.log('🔄 Loading specific session:', sessionId);
    
    try {
      // Show loading toast
      const loadingToastId = toast.loading('Loading chat session...');
      
      // First, get the session data with messages
      const response = await fetch(`/backend/api/chat/${sessionId}/messages`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const sessionData = await response.json();
        console.log('📄 Session data loaded:', sessionData);
        
        // Check if the document still exists
        const docExists = await checkDocumentExists(sessionData.document.id);
        
        if (!docExists) {
          toast.error('Document no longer exists. Cannot load this session.', { id: loadingToastId });
          setDocumentExists(false);
          setCurrentDocument(null);
          setCurrentSessionId(null);
          setChatHistory([]);
          return;
        }
        
        // Set the session ID first
        setCurrentSessionId(sessionData.sessionId);
        setDocumentExists(true);
        
        // Create document info from session data
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
        
        // Load the PDF into RAG system
        try {
          console.log('📤 Loading PDF into RAG system...');
          await loadPdfIntoRagSystem(sessionData.document.id);
          toast.success('Document and chat history loaded successfully', { id: loadingToastId });
        } catch (pdfError) {
          console.error('❌ Failed to load PDF:', pdfError);
          
          const errorMessage = pdfError instanceof Error ? pdfError.message : 'Unknown error';
          
          if (errorMessage.includes('not found') || errorMessage.includes('404')) {
            toast.error('Document file not found. Session loaded but document unavailable.', { 
              id: loadingToastId 
            });
            setDocumentExists(false);
          } else {
            toast.warning('Chat history loaded but document may not be available for new questions', { 
              id: loadingToastId 
            });
          }
        }
        
        // Set document and messages
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
        toast.error('Authentication failed. Please sign in again.', { id: loadingToastId });
      } else if (response.status === 404) {
        toast.error('Chat session not found.', { id: loadingToastId });
        handleDocumentDeleted();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load session');
      }
    } catch (error) {
      console.error('❌ Failed to load specific session:', error);
      toast.error('Failed to load chat session');
      handleDocumentDeleted();
    } finally {
      setIsLoadingSession(false);
    }
  };

  // New helper function to load PDF into RAG system with better error handling
  const loadPdfIntoRagSystem = async (documentId: string): Promise<void> => {
    try {
      console.log('🔄 Loading PDF for document:', documentId);
      
      // Check if document exists first
      const exists = await checkDocumentExists(documentId);
      if (!exists) {
        throw new Error('Document no longer exists in database');
      }
      
      // Get document details
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
      
      const documentData = await documentResponse.json();
      console.log('📄 Document details:', documentData.originalName);
      
      // Get the file
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
      
      // Get file blob
      const fileBlob = await fileResponse.blob();
      console.log('📁 File blob size:', fileBlob.size);
      
      // Create File object
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
      console.log('✅ PDF loaded into RAG system:', ragResult);
      
    } catch (error) {
      console.error('❌ Failed to load PDF into RAG system:', error);
      throw error;
    }
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
          
          // Check if the document for this session still exists
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
      
      // Check if document still exists before creating session
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
      
      // Double-check document exists before creating session
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
        // Document was deleted
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
    // Add validation to prevent saving with undefined sessionId or non-existent document
    if (!currentSessionId || !user || chatHistory.length === 0 || !documentExists) {
      console.log('Skipping save - missing requirements:', {
        currentSessionId: !!currentSessionId,
        user: !!user,
        chatHistoryLength: chatHistory.length,
        documentExists
      });
      return;
    }

    // Additional validation to ensure sessionId is a valid string
    if (typeof currentSessionId !== 'string' || currentSessionId.trim() === '') {
      console.error('Invalid session ID:', currentSessionId);
      return;
    }

    try {
      setIsSaving(true);
      
      // Generate title from first user message if not set
      const firstUserMessage = chatHistory.find(m => m.type === 'USER');
      const title = firstUserMessage 
        ? `${firstUserMessage.content.substring(0, 50)}${firstUserMessage.content.length > 50 ? '...' : ''}`
        : `Chat with ${currentDocument?.originalName || 'Document'}`;

      console.log('Saving session:', {
        sessionId: currentSessionId,
        title,
        messageCount: chatHistory.length
      });

      // Update session title
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
      // Check if it's a document deletion issue
      if (error instanceof Error && error.message.includes('not found')) {
        setDocumentExists(false);
        handleDocumentDeleted();
      }
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    // Only save if we have unsaved changes and it's been at least 2 seconds since last save
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
  
  // Update the addMessage function to properly set unsaved changes
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
    setHasUnsavedChanges(true); // Mark as having unsaved changes

    // Save individual message to database
    if (currentSessionId && typeof currentSessionId === 'string' && currentSessionId.trim() !== '') {
      try {
        console.log('Saving message to database:', newMessage.content.substring(0, 50));
        const response = await fetch('/backend/api/chat-messages', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            id: newMessage.id,
            sessionId: currentSessionId,
            role: newMessage.type.toUpperCase(), // USER or ASSISTANT
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
        // Message is still in local state, so chat continues to work
      }
    } else {
      console.warn('Cannot save message - invalid session ID:', currentSessionId);
    }
  };
  
  // Function to handle when current document is deleted
  const handleDocumentDeleted = () => {
    console.log('🗑️ Handling document deletion - resetting to upload state');
    
    // Reset all state to go back to upload page
    setCurrentSessionId(null);
    setChatHistory([]);
    setCurrentDocument(null);
    setQuery('');
    setError('');
    setShowPresets(true);
    setDocumentExists(false);
    
    // Notify parent component to update system status
    onUploadSuccess({
      documentId: '',
      filename: '',
      originalName: '',
      size: 0,
      uploadedAt: '',
      pages_processed: 0
    });
    
    toast.info('Document no longer available - returned to upload page');
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
      setDocumentExists(true);
      
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
    if (!documentExists) {
      toast.error('Document no longer exists and cannot be saved');
      return;
    }
    setIsSaveModalOpen(true);
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

    // Check if document is already saved (indexed status means it's saved)
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
      
      // Check if document still exists before saving
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
    setDocumentExists(true);
    
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
              {!documentExists && (
                <AlertCircle className="w-6 h-6 text-red-500" />
              )}
              <FileText className={`w-6 h-6 ${documentExists ? 'text-blue-600' : 'text-gray-400'}`} />
              <div>
                <h3 className={`font-semibold ${documentExists ? 'text-gray-900' : 'text-gray-500'}`}>
                  {currentDocument.originalName}
                  {!documentExists && ' (Document Deleted)'}
                </h3>
                <p className={`text-sm ${documentExists ? 'text-gray-600' : 'text-red-600'}`}>
                  {documentExists ? (
                    <>
                      {currentDocument.pages} pages • {formatFileSize(currentDocument.size)} • 
                      Uploaded {new Date(currentDocument.uploadedAt).toLocaleDateString()}
                      {currentSessionId && (
                        <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
                          Session Active
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
                  onClick={handleSaveModal}
                  disabled={!documentExists || currentDocument?.status === 'INDEXED'}
                  className={`flex items-center p-2 px-3 text-sm rounded-lg transition-all duration-300 ${
                    !documentExists || currentDocument?.status === 'INDEXED' 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'text-black hover:brightness-105 hover:bg-yellow-200/20 hover:text-yellow-600 cursor-pointer'
                  }`}
                >
                  <GoDownload className="w-4 h-4 mr-1" />
                  {!documentExists 
                    ? 'Unavailable'
                    : currentDocument?.status === 'INDEXED' 
                      ? 'Saved' 
                      : 'Save File'
                  }
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
            {/* Document Deleted Warning */}
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

            {/* Chat Messages Container - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <div className="max-w-6xl mx-auto space-y-4">
                {chatHistory.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    <MessageSquare className="mx-auto w-12 h-12 mb-4" />
                    <p className="text-lg font-medium">
                      {documentExists ? 'Start a conversation' : 'Chat History'}
                    </p>
                    <p>
                      {documentExists 
                        ? 'Ask questions about your uploaded document.'
                        : 'This document is no longer available.'
                      }
                    </p>
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
              {showPresets && Object.keys(presetQueries).length > 0 && chatHistory.length === 0 && documentExists && (
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

              {/* Input Area - Only show if document exists */}
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

              {/* Document Deleted Message */}
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