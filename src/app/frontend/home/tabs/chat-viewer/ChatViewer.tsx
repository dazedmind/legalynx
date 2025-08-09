// Updated ChatViewer.tsx with FIXED session creation workflow
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FileText, AlertCircle, Plus, ArrowUp, Cloud, DiamondPlus } from 'lucide-react';
import { apiService, handleApiError, UploadResponse, isSecurityError, getSecurityErrorMessage, profileService } from '../../../lib/api';
import { toast, Toaster } from 'sonner';
import { useAuth } from '@/lib/context/AuthContext';
import { authUtils } from '@/lib/auth';
import { useRAGCache } from '@/lib/ragCacheService';
import ConfirmationModal from '../../../components/ConfirmationModal';
import { ChatContainer } from './ChatContainer';
import SessionLoader from '../../../components/SessionLoader';
import { CloudCheck, AudioLines } from 'lucide-react';
import { ModalType } from '../../../components/ConfirmationModal';
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
  currentDocumentId?: string | null;
  lastUploadedDocumentId?: string;
}

type LoadingStage = 'loading_session' | 'loading_document' | 'loading_rag' | 'preparing_chat';

export default function ChatViewer({ 
  isSystemReady, 
  onUploadSuccess, 
  onSessionDelete,
  selectedSessionId, 
  handleNewChat,
  handleVoiceChat,
  currentDocumentId,
  onClearStateCallback,
  lastUploadedDocumentId 
}: CombinedComponentProps & { onClearStateCallback?: (clearFn: () => void) => void }) {
  const { isAuthenticated, user } = useAuth();
  const ragCache = useRAGCache();
  
  // ✅ FIXED: Add refs for better state management
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveAttemptRef = useRef<number>(0);
  const pendingMessagesRef = useRef<ChatMessage[]>([]);

  // Add state to track if we're processing a new upload
  const [isProcessingNewUpload, setIsProcessingNewUpload] = useState(false);
  const [lastProcessedDocumentId, setLastProcessedDocumentId] = useState<string | null>(null);

  // Document and session states
  const [currentDocument, setCurrentDocument] = useState<any>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [documentExists, setDocumentExists] = useState(true);
  const [isLoadingDocument, setIsLoadingDocument] = useState(true);
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [savedSessions, setSavedSessions] = useState<SavedChatSession[]>([]);
  const [isVoiceChat, setIsVoiceChat] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState('');

  // Loading stage tracking
  const [loadingStage, setLoadingStage] = useState<LoadingStage>('loading_session');
  const [loadingSessionInfo, setLoadingSessionInfo] = useState<{
    title?: string;
    documentName?: string;
  }>({});
  
  // Chat states
  const [query, setQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const isSubmittingRef = useRef(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaveTimestamp, setLastSaveTimestamp] = useState(Date.now());
  const [uploadCompleted, setUploadCompleted] = useState(false);

  // Modal state for confirmation
  const [confirmationModalConfig, setConfirmationModalConfig] = useState<{
    header: string;
    message: string;
    trueButton: string;
    falseButton: string;
    type: string;
    onConfirm: () => void;
    paywall?: {
      isPaywallFeature: boolean;
      userProfile?: any;
      featureType?: 'saveSessions' | 'cloudStorage' | 'voiceMode' | 'fileHistory' | 'pdfDownload';
      onUpgrade?: () => void;
      allowTemporary?: boolean; // For features that can fallback to temporary
    }
  } | null>(null);

  // FIXED: Clear all session state when new document is uploaded
  const clearAllSessionState = () => {
    console.log("🧹 Clearing all session state for new upload");
    setCurrentSessionId(null);
    setChatHistory([]);
    setCurrentDocument(null);
    setQuery('');
    setError('');
    setDocumentExists(true); // Reset to true for new document
    setIsLoadingSession(false);
    setLoadingSessionId(null);
    setHasUnsavedChanges(false);
    setIsVoiceChat(false);
    
    // Clear any cached RAG data
    ragCache.clearAll();
  };

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
    const getSubscriptionStatus = async () => {
      const profile = await profileService.getProfile();
      setSubscriptionStatus(profile.subscription?.plan_type?.toUpperCase());
    };
    getSubscriptionStatus();  
  }, []);


  const hasCloudStorageAccess = () => {
    if (!subscriptionStatus) return false;
    const plan = subscriptionStatus;
    if (plan === 'BASIC') {
      return false;
    } else {
      return true;
    }
  };


  const handleVoiceModeClick = () => {
    const plan = subscriptionStatus;
    
    if (plan !== 'PREMIUM') {
      setConfirmationModalConfig({
        header: 'Voice Mode',
        message: 'Interact with Legalynx AI using voice commands for a hands-free experience.',
        trueButton: 'Upgrade to Premium',
        falseButton: 'Cancel',
        type: ModalType.PAYWALL,
        onConfirm: () => {},
        paywall: {
          isPaywallFeature: true,
          userProfile: user,
          featureType: 'voiceMode',
          onUpgrade: () => {
            window.location.href = '/frontend/pricing';
          },
          allowTemporary: false // Voice mode has no fallback
        }
      });
      return;
    }

    // User has access, proceed with voice mode
    if (handleVoiceChat) {
      setIsVoiceChat(true);
    }
  };

  // Effects
  useEffect(() => {
    console.log('🔍 Document loading effect:', {
      isSystemReady,
      currentDocument: currentDocument !== null,
      isResetting,
      user: !!user,
      uploadCompleted,
      isProcessingNewUpload,
      currentDocumentId,        // 🔥 NEW: Added for tracking
      lastUploadedDocumentId    // 🔥 NEW: Added for tracking
    });
    
    // 🔥 FIXED: Only load if we don't have a current document and not resetting
    if ((currentDocument === null && !isResetting && !isProcessingNewUpload) || 
        uploadCompleted || 
        (currentDocumentId && currentDocument?.id !== currentDocumentId) ||
        (lastUploadedDocumentId && currentDocument?.id !== lastUploadedDocumentId)) {
      console.log('📄 Loading current document...');
      loadCurrentDocument();
      
      if (uploadCompleted) {
        setUploadCompleted(false);
      }
    }
  }, [user, isResetting, currentDocument, uploadCompleted, isProcessingNewUpload, currentDocumentId, lastUploadedDocumentId]);


  useEffect(() => {
    console.log('🔍 Upload tracking effect:', {
      isSystemReady,
      isProcessingNewUpload,
      currentDocumentId,
      lastProcessedDocumentId,
      lastUploadedDocumentId
    });
    
    // 🔥 NEW: If we have a new document ID that differs from last processed, handle the upload
    if (currentDocumentId && 
        currentDocumentId !== lastProcessedDocumentId && 
        !isProcessingNewUpload) {
      
      console.log('📄 New document uploaded:', currentDocumentId);
      setIsProcessingNewUpload(true);
      setLastProcessedDocumentId(currentDocumentId);
      
      // Clear all previous state
      clearAllSessionState();
      
      // Load the new document
      loadCurrentDocument().finally(() => {
        setIsProcessingNewUpload(false);
      });
    }

     // 🔥 NEW: Also handle lastUploadedDocumentId changes
  if (lastUploadedDocumentId && 
    lastUploadedDocumentId !== lastProcessedDocumentId && 
    !isProcessingNewUpload) {
  
  console.log('📄 Last uploaded document changed:', lastUploadedDocumentId);
  setIsProcessingNewUpload(true);
  setLastProcessedDocumentId(lastUploadedDocumentId);
  
  // Clear all previous state
  clearAllSessionState();
  
  // Load the new document
  loadCurrentDocument().finally(() => {
    setIsProcessingNewUpload(false);
  });
}
}, [currentDocumentId, lastProcessedDocumentId, isProcessingNewUpload, lastUploadedDocumentId]);

    // Register clear function with parent
    useEffect(() => {
      if (onClearStateCallback) {
        onClearStateCallback(clearAllSessionState);
      }
    }, [onClearStateCallback]);
    
  useEffect(() => {
    console.log('🔍 Upload success effect:', {
      isSystemReady,
      isProcessingNewUpload,
      currentDocumentId,
      lastProcessedDocumentId
    });
    
    // If we have a new document ID that differs from last processed, handle the upload
    if (currentDocumentId && 
        currentDocumentId !== lastProcessedDocumentId && 
        !isProcessingNewUpload) {
      
      console.log('📄 New document uploaded:', currentDocumentId);
      setIsProcessingNewUpload(true);
      setLastProcessedDocumentId(currentDocumentId);
      
      // Clear all previous state (defer to next tick to avoid cross-render state updates)
      setTimeout(() => {
        clearAllSessionState();
      }, 0);
      
      // Load the new document (defer to next tick)
      setIsLoadingDocument(true);
      setTimeout(() => {
        loadCurrentDocument().finally(() => {
          setIsProcessingNewUpload(false);
          setIsLoadingDocument(false);
        });
      }, 0);
    }
  }, [currentDocumentId, lastProcessedDocumentId, isProcessingNewUpload]);

  useEffect(() => {
    console.log('🔍 Upload success effect triggered');
    
    if (isSystemReady && !isResetting) {
      console.log('📄 Triggering loadCurrentDocument after upload success');
      loadCurrentDocument();
    }
  }, []);

  useEffect(() => {
    if (isResetting) return;
    if (selectedSessionId && 
        selectedSessionId !== currentSessionId && 
        selectedSessionId !== loadingSessionId && 
        !isLoadingSession
      ) {
      loadSpecificSession(selectedSessionId);
    }
  }, [selectedSessionId, currentSessionId, loadingSessionId, isLoadingSession, isResetting]);

  useEffect(() => {
    if (currentDocument && user && !currentSessionId && documentExists && !isResetting && !isProcessingNewUpload) {
      console.log('📝 Document loaded, creating/loading session...');
      loadOrCreateSession();
    }
  }, [currentDocument, user, currentSessionId, documentExists, isResetting, isProcessingNewUpload]);

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

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is becoming hidden - save immediately
        console.log('📱 Tab becoming hidden - saving session');
        if (hasUnsavedChanges && currentSessionId && chatHistory.length > 0) {
          saveSessionToDatabase(true); // Force save
        }
      } else {
        // Tab is becoming visible - check if we need to save
        console.log('📱 Tab becoming visible - checking for unsaved changes');
        if (hasUnsavedChanges && currentSessionId && chatHistory.length > 0) {
          // Short delay to allow for state stabilization
          setTimeout(() => {
            saveSessionToDatabase(true);
          }, 100);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also handle beforeunload for browser close/refresh
    const handleBeforeUnload = () => {
      if (hasUnsavedChanges && currentSessionId && chatHistory.length > 0) {
        // Use sendBeacon for more reliable saving on page unload
        const payload = JSON.stringify({
          title: chatHistory.find(m => m.type === 'USER')?.content.substring(0, 50) || 'Chat',
          updatedAt: new Date().toISOString(),
          isSaved: true
        });
        
        navigator.sendBeacon(
          `/backend/api/chat-sessions/${currentSessionId}`,
          new Blob([payload], { type: 'application/json' })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, currentSessionId, chatHistory.length]);

  useEffect(() => {
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (chatHistory.length > 0 && currentSessionId && user && documentExists && hasUnsavedChanges) {
      console.log('⏱️ Scheduling save in 2 seconds...');
      
      saveTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Auto-save timeout triggered');
        saveSessionToDatabase();
      }, 2000); // Increased to 2 seconds for better stability
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [chatHistory.length, currentSessionId, documentExists, hasUnsavedChanges]); // Removed user from deps to prevent unnecessary re-triggers

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
    console.log('🔍 LOAD DOCUMENT STARTING:', {
      isResetting,
      hasCurrentDocument: currentDocument !== null,
      isAuthenticated,
      userId: user?.id,
      isProcessingNewUpload,
      lastUploadedDocumentId
    });
    
    if (isResetting && !isProcessingNewUpload) {
      console.log('🚫 Skipping document load - currently resetting');
      return;
    }

    let documentFound = false;

    if (currentDocumentId) {
      console.log('🎯 Loading specific document by ID:', currentDocumentId);
      await loadSpecificDocument(currentDocumentId);
      documentFound = true; // loadSpecificDocument will set state appropriately
      return;
    }

    // 🔥 FIXED: If we have a lastUploadedDocumentId, prioritize that
    if (lastUploadedDocumentId) {
      console.log('🎯 Loading last uploaded document:', lastUploadedDocumentId);
      await loadSpecificDocument(lastUploadedDocumentId);
      documentFound = true;
      return;
    }
    
    try {
      if (isAuthenticated && user) {
        console.log('👤 Checking API for documents...');
        const response = await fetch('/backend/api/documents', {
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('📄 API documents response:', data);
          
          if (data.documents && data.documents.length > 0) {
            const mostRecent = data.documents[0];
            console.log('📄 Most recent from API:', mostRecent);
            
            const exists = await checkDocumentExists(mostRecent.id);
            console.log('📄 Document exists check:', exists);
            
            if (exists && !isResetting) {
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
              
              console.log('✅ Loading document from API:', documentInfo.originalFileName);
              setCurrentDocument(documentInfo);
              setDocumentExists(true);
              documentFound = true;
              return;
            } else {
              console.log('❌ Most recent document no longer exists or resetting');
              // Do not set documentExists=false yet to avoid UI flicker; try localStorage next
            }
          } else {
            console.log('📄 No documents found in API');
          }
        } else {
          console.log('❌ API request failed:', response.status);
        }
      }
      
      // Check localStorage for both authenticated and non-authenticated users
      console.log('💿 Checking localStorage...');
      const storageKey = isAuthenticated && user?.id ?
        `uploaded_documents_${user.id}` : 'uploaded_documents';
      console.log('💿 Storage key:', storageKey);
      
      const savedDocs = localStorage.getItem(storageKey);
      console.log('💿 Raw localStorage data:', savedDocs);
      
      if (savedDocs) {
        const docs = JSON.parse(savedDocs);
        console.log('💿 Parsed docs:', docs);
        
        if (docs.length > 0 && !isResetting) {
          const sortedDocs = docs.sort((a: any, b: any) => {
            const timeA = new Date(a.uploadedAt || a.uploaded_at || 0).getTime();
            const timeB = new Date(b.uploadedAt || b.uploaded_at || 0).getTime();
            return timeB - timeA;
          });
          
          const mostRecentDoc = sortedDocs[0];
          console.log('💿 Most recent from localStorage:', mostRecentDoc);
          
          const documentInfo = {
            id: mostRecentDoc.id || mostRecentDoc.documentId,
            fileName: mostRecentDoc.fileName || mostRecentDoc.filename,
            originalFileName: mostRecentDoc.originalFileName || mostRecentDoc.original_file_name || mostRecentDoc.originalName,
            fileSize: mostRecentDoc.fileSize || mostRecentDoc.file_size || mostRecentDoc.size,
            uploadedAt: mostRecentDoc.uploadedAt || mostRecentDoc.uploaded_at,
            pageCount: mostRecentDoc.pageCount || mostRecentDoc.page_count || mostRecentDoc.pages_processed,
            status: mostRecentDoc.status || 'TEMPORARY',
            databaseId: mostRecentDoc.databaseId || mostRecentDoc.id
          };
          
          console.log('✅ Final document info from localStorage:', documentInfo);
          setCurrentDocument(documentInfo);
          setDocumentExists(true);
          documentFound = true;
        } else {
          console.log('💿 No documents in localStorage or resetting');
        }
      } else {
        console.log('💿 No localStorage data found');
      }
    } catch (error) {
      console.error('❌ Failed to load current document:', error);
      // Only set to false on errors after all checks
      setDocumentExists(false);
    }

    // If after all checks nothing was found, mark as not existing to avoid stale state
    if (!documentFound && !isResetting) {
      setDocumentExists(false);
      setCurrentDocument(null);
    }
  };

  // 🔥 NEW: Load a specific document by ID
  const loadSpecificDocument = async (documentId: string) => {
    console.log('🎯 Loading specific document:', documentId);
    
    try {
      // First check localStorage
      const storageKey = isAuthenticated && user?.id ?
        `uploaded_documents_${user.id}` : 'uploaded_documents';
      
      const savedDocs = localStorage.getItem(storageKey);
      if (savedDocs) {
        const docs = JSON.parse(savedDocs);
        const specificDoc = docs.find((doc: any) => 
          doc.id === documentId || doc.documentId === documentId
        );
        
        if (specificDoc) {
          console.log('✅ Found specific document in localStorage:', specificDoc);
          
          const documentInfo = {
            id: specificDoc.id || specificDoc.documentId,
            fileName: specificDoc.fileName || specificDoc.filename,
            originalFileName: specificDoc.originalFileName || specificDoc.original_file_name || specificDoc.originalName,
            fileSize: specificDoc.fileSize || specificDoc.file_size || specificDoc.size,
            uploadedAt: specificDoc.uploadedAt || specificDoc.uploaded_at,
            pageCount: specificDoc.pageCount || specificDoc.page_count || specificDoc.pages_processed,
            status: specificDoc.status || 'TEMPORARY',
            databaseId: specificDoc.databaseId || specificDoc.id
          };
          
          setCurrentDocument(documentInfo);
          setDocumentExists(true);
          return;
        }
      }

      // If not found in localStorage and user is authenticated, check API
      if (isAuthenticated && user) {
        console.log('🔍 Checking API for specific document:', documentId);
        const response = await fetch(`/backend/api/documents/${documentId}`, {
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          const documentData = await response.json();
          console.log('✅ Found specific document in API:', documentData);
          
          const documentInfo = {
            id: documentData.id,
            fileName: documentData.fileName,
            originalFileName: documentData.originalFileName,
            fileSize: documentData.fileSize,
            uploadedAt: documentData.uploadedAt,
            pageCount: documentData.pageCount,
            status: documentData.status,
            databaseId: documentData.id
          };
          
          setCurrentDocument(documentInfo);
          setDocumentExists(true);
          return;
        }
      }
      
      console.log('❌ Specific document not found:', documentId);
      setDocumentExists(false);
      setCurrentDocument(null);
      
    } catch (error) {
      console.error('❌ Failed to load specific document:', error);
      setDocumentExists(false);
      setCurrentDocument(null);
    }
  };

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
      setLoadingStage('loading_session');
      const response = await fetch(`/backend/api/chat/${sessionId}/messages`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const sessionData = await response.json();
        console.log('📄 Session data loaded:', sessionData);
        
        setLoadingSessionInfo({
          title: sessionData.title || `Chat with ${sessionData.document.name}`,
          documentName: sessionData.document.name
        });
        
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
        
        setLoadingStage('preparing_chat');
        setCurrentDocument(documentInfo);
        
        const formattedMessages: ChatMessage[] = sessionData.messages.map((msg: any) => ({
          id: msg.id,
          type: msg.role?.toUpperCase() as 'USER' | 'ASSISTANT',
          content: msg.content,
          createdAt: new Date(msg.created_at), 
          sourceCount: msg.tokens_used
        }));
        
        setChatHistory(formattedMessages);
        
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

  const loadPdfIntoRagSystemCached = async (documentId: string, filename: string): Promise<void> => {
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

    try {
      await ragCache.loadDocument(documentId, filename, getFileBlob);
    } catch (error) {
      console.error('❌ Failed to load PDF into RAG system:', error);
      
      // Provide user-friendly error messages
      let userMessage = 'Failed to load document into AI system';
      
      if (error instanceof Error) {
        if (error.message.includes('not available') || error.message.includes('Failed to fetch')) {
          userMessage = 'AI system is not available. Please ensure the backend service is running.';
          toast.error('AI system unavailable. Please contact support.');
        } else if (error.message.includes('Not Found')) {
          userMessage = 'AI system endpoint not found. Please check the system configuration.';
          toast.error('AI system configuration error. Please contact support.');
        } else if (error.message.includes('empty') || error.message.includes('corrupted')) {
          userMessage = 'Document file is corrupted or empty. Please re-upload the document.';
          toast.error('Document file is corrupted. Please re-upload.');
        } else {
          userMessage = error.message;
          toast.error('Failed to load document into AI system');
        }
      }
      
      // Re-throw with user-friendly message
      throw new Error(userMessage);
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
              createdAt: new Date(msg.created_at || msg.timestamp)
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

  const addMessage = async (
    message: Omit<ChatMessage, 'id' | 'createdAt'>,
    sessionIdOverride?: string
  ) => {
    if (!documentExists) {
      console.warn('Cannot add message - document does not exist');
      return;
    }

    const newMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };

    // ✅ FIXED: Update state first
    setChatHistory(prev => [...prev, newMessage]);
    setHasUnsavedChanges(true);

    // ✅ FIXED: Save individual message immediately to database
    const sessionIdToUse = sessionIdOverride ?? currentSessionId;
    
    if (sessionIdToUse && typeof sessionIdToUse === 'string' && sessionIdToUse.trim() !== '') {
      try {
        console.log('💾 Saving message to session immediately:', sessionIdToUse);
        const response = await fetch('/backend/api/chat-messages', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            id: newMessage.id,
            sessionId: sessionIdToUse,
            role: newMessage.type.toUpperCase(),
            content: newMessage.content,
            createdAt: newMessage.createdAt.toISOString(),
            tokensUsed: 0
          })
        });

        if (response.ok) {
          const savedMessage = await response.json();
          console.log('✅ Message saved immediately:', savedMessage.messageId || savedMessage.id);
          
          // ✅ FIXED: Update session metadata immediately after message save
          setTimeout(() => {
            saveSessionToDatabase(true);
          }, 100);
          
        } else if (response.status === 404) {
          console.log('❌ Session not found, document may have been deleted');
          setDocumentExists(false);
          handleDocumentDeleted();
        } else {
          const errorData = await response.json();
          console.error('❌ Failed to save message:', errorData);
        }
      } catch (error) {
        console.error('❌ Failed to save message to database:', error);
      }
    } else {
      console.warn('⚠️ Cannot save message - invalid or missing session ID:', sessionIdToUse);
    }
  };

  // ✅ FIXED: Modified loadOrCreateSession to immediately create session when none exists
  const loadOrCreateSession = async () => {
    if (!user || !currentDocument || isCreatingSession || !documentExists) return;

    // FIXED: Skip session loading if we're processing a new upload
    if (isProcessingNewUpload) {
      console.log('⏸️ Skipping session load - processing new upload');
      return;
    }

    try {
      setIsCreatingSession(true);
      const documentId = currentDocument.databaseId || currentDocument.id;
      
      console.log('🔍 Looking for existing session for document:', documentId);
      
      const exists = await checkDocumentExists(documentId);
      if (!exists) {
        console.log('❌ Document no longer exists');
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
        console.log('✅ Found existing session:', session.id);
        setCurrentSessionId(session.id);
        
        try {
          const messagesResponse = await fetch(
            `/backend/api/chat/${session.id}/messages`,
            { headers: getAuthHeaders() }
          );
          
          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json();
            const messages = messagesData.messages || [];
            
            const formattedMessages = messages.map((msg: any) => ({
              id: msg.id,
              type: msg.role.toUpperCase(),
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
        // FIXED: For new uploads, immediately create session
        if (isProcessingNewUpload || lastProcessedDocumentId === documentId) {
          console.log('📝 New upload detected - creating fresh session immediately');
          const newSessionId = await createNewSession(documentId);
          
          if (!newSessionId) {
            console.error('❌ Failed to create new session');
            setDocumentExists(false);
            handleDocumentDeleted();
          } else {
            console.log('✅ Created fresh session for new upload:', newSessionId);
            setChatHistory([]);
          }
        } else {
          console.log('📝 No existing session found for existing document');
        }
        
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

    
  // ✅ FIXED: Return session ID and handle async session creation properly
  const createNewSession = async (documentId?: string): Promise<string | null> => {
    if (!user || !currentDocument || isCreatingSession || !documentExists) return null;
    
    if (!currentDocument.databaseId) {
      toast.error('Document is not saved to your account');
      return null;
    }
    
    try {
      setIsCreatingSession(true);
      const useDocumentId = documentId || currentDocument.databaseId || currentDocument.id;
      
      console.log('🆕 Creating new session for document:', useDocumentId);
      
      const exists = await checkDocumentExists(useDocumentId);
      if (!exists) {
        setDocumentExists(false);
        handleDocumentDeleted();
        return null;
      }
      
      const response = await fetch('/backend/api/chat-sessions', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userId: user.id,
          documentId: useDocumentId,
          title: `Chat with ${currentDocument.originalFileName || currentDocument.originalName}`,
          isSaved: false
        })
      });

      if (response.ok) {
        const session = await response.json();
        const newSessionId = session.id || session.sessionId;
        
        setCurrentSessionId(newSessionId);
        setChatHistory([]);
        console.log('✅ New chat session created:', newSessionId);        
        return newSessionId;
      } else if (response.status === 404) {
        setDocumentExists(false);
        handleDocumentDeleted();
        return null;
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
      return null;
    } finally {
      setIsCreatingSession(false);
    }
  };

  const saveSessionToDatabase = async (force = false) => {
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

    // ✅ FIXED: Prevent rapid successive saves
    const now = Date.now();
    if (!force && (now - lastSaveAttemptRef.current) < 500) {
      console.log('Skipping save - too soon after last attempt');
      return;
    }
    lastSaveAttemptRef.current = now;

    try {
      setIsSaving(true);
      
      const firstUserMessage = chatHistory.find(m => m.type === 'USER');
      const title = firstUserMessage 
        ? `${firstUserMessage.content.substring(0, 50)}${firstUserMessage.content.length > 50 ? '...' : ''}`
        : `Chat with ${currentDocument?.originalName || 'Document'}`;

      console.log('💾 Saving session:', {
        sessionId: currentSessionId,
        title,
        messageCount: chatHistory.length,
        force
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
      console.log('✅ Session saved successfully:', result);
      
      setHasUnsavedChanges(false);
      setLastSaveTimestamp(Date.now());

    } catch (error) {
      console.error('❌ Failed to save session to database:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        setDocumentExists(false);
        handleDocumentDeleted();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleMessageAction = async (action: string, messageId: string, content?: string) => {
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
      case 'edit':
        console.log('Editing message:', messageId);
        await handleEditMessage(messageId, content || '');
        break;
      default:
        break;
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!newContent.trim()) {
      toast.error('Message cannot be empty');
      return;
    }
  
    try {
      setIsQuerying(true);
      
      // Find the message being edited
      const messageIndex = chatHistory.findIndex(msg => msg.id === messageId);
      if (messageIndex === -1) {
        toast.error('Message not found');
        return;
      }
  
      const messageToEdit = chatHistory[messageIndex];
      if (messageToEdit.type !== 'USER') {
        toast.error('Only user messages can be edited');
        return;
      }
  
      // Update the message content in chat history
      const updatedChatHistory = [...chatHistory];
      updatedChatHistory[messageIndex] = {
        ...messageToEdit,
        content: newContent,
        createdAt: new Date() // Update timestamp to show it was edited
      };
  
      // Remove all messages after the edited message (including assistant responses)
      const messagesToKeep = updatedChatHistory.slice(0, messageIndex + 1);
      setChatHistory(messagesToKeep);
  
      // Update the message in the database if we have a session
      if (currentSessionId && user && documentExists) {
        try {
          const response = await fetch(`/backend/api/chat-messages/${messageId}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              content: newContent,
              updatedAt: new Date().toISOString()
            })
          });
  
          if (!response.ok) {
            console.warn('Failed to update message in database, but continuing with regeneration');
          }
        } catch (error) {
          console.warn('Failed to update message in database:', error);
          // Continue with regeneration even if database update fails
        }
      }
  
      // Generate new response based on the edited message
      const result = await apiService.queryDocuments(newContent);
      
      // Add the new assistant response
      await addMessage({
        type: 'ASSISTANT',
        content: result.response,
        query: newContent,
        sourceCount: result.sourceCount
      });
  
      toast.success('Message updated and response regenerated');
  
    } catch (error) {
      console.error('Edit message error:', error);
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      toast.error('Failed to regenerate response: ' + errorMessage);
      
      // In case of error, we might want to revert the chat history
      // But for better UX, we'll keep the edited message and let user try again
      
    } finally {
      setIsQuerying(false);
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
        setSavedSessions(prev => prev.filter(s => s.id !== sessionId));
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
    const messageIndex = chatHistory.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;
  
    const assistantMessage = chatHistory[messageIndex];
    if (assistantMessage.type !== 'ASSISTANT') return;
  
    const userMessage = chatHistory[messageIndex - 1];
    if (!userMessage || userMessage.type !== 'USER') return;
  
    try {
      setIsQuerying(true);
      
      // Remove the assistant message we're regenerating
      setChatHistory(prev => prev.filter(msg => msg.id !== messageId));
      
      // Delete from database if we have session
      if (currentSessionId && user && documentExists) {
        try {
          await fetch(`/backend/api/chat-messages/${messageId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
        } catch (error) {
          console.warn('Failed to delete message from database:', error);
        }
      }
      
      // Re-run the query with a slight modification to encourage different response
      const result = await apiService.queryDocuments(userMessage.content + " (Please provide a more detailed response)");
      
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
    if (isSubmittingRef.current || isQuerying) return;
    const currentQuery = queryText || query;
    
    if (!currentQuery.trim()) {
        setError('Please enter a query');
        return;
    }

    if (!documentExists) {
        setError('Document no longer exists. Cannot process queries.');
        return;
    }

    // FIXED: Verify we have current document loaded in RAG system
    if (!currentDocument) {
        setError('No document loaded. Please upload a document first.');
        return;
    }

    // FIXED: Double-check that backend has the right document
    try {
        const isDevelopment = process.env.NODE_ENV === 'development';
        const RAG_BASE_URL = isDevelopment ? "http://localhost:8000" : process.env.NEXT_PUBLIC_RAG_API_URL;
        
        const statusResponse = await fetch(`${RAG_BASE_URL}/current-document`, {
            headers: getAuthHeaders(),
        });
        
        if (statusResponse.ok) {
            const currentDoc = await statusResponse.json();
            if (!currentDoc.has_document) {
                setError('No document loaded in AI system. Please refresh and re-upload.');
                return;
            }
            
            // Log for debugging
            console.log('🔍 Backend current document:', currentDoc.document_id);
            console.log('🔍 Frontend current document:', currentDocument.id);
        }
    } catch (error) {
        console.warn('Could not verify backend document status:', error);
        // Continue with query - don't fail for verification issues
    }

    // Immediately lock UI and clear input to prevent double-submit
    isSubmittingRef.current = true;
    setIsQuerying(true);
    setError('');
    setQuery('');

    let sessionId = currentSessionId;
    
    if (!sessionId && user && currentDocument) {
        if (isCreatingSession) {
            toast.info('Creating session, please wait...');
            return;
        }
        
        console.log('🆕 No session found, creating new session before query...');
        sessionId = await createNewSession();
        
        if (!sessionId) {
            setError('Failed to create chat session');
            return;
        }
        
        console.log('✅ Session created successfully:', sessionId);
    }

    await addMessage({
        type: 'USER',
        content: currentQuery,
        query: currentQuery
    }, sessionId || undefined);

    // already set querying and cleared input above

    try {
        const result = await apiService.queryDocuments(currentQuery);
        
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
        }, sessionId || undefined);
        
    } catch (error) {
        console.error('Query error:', error);
        
        if (isSecurityError(error)) {
            const securityErrorMessage = getSecurityErrorMessage(error);
            setError(securityErrorMessage);
            
            let assistantResponse = '';
            
            switch (error.type) {
                case 'rate_limit':
                    assistantResponse = '⏱️ I\'m temporarily unavailable due to rate limiting. Please wait a moment before asking your next question.';
                    toast.error('Query rate limit exceeded');
                    break;
                    
                case 'injection':
                    assistantResponse = '🛡️ I detected potentially harmful content in your query. Please rephrase your question using normal, conversational language and I\'ll be happy to help.';
                    toast.warning('Query was blocked for security reasons');
                    break;
                    
                default:
                    assistantResponse = `🔒 Security Error: ${securityErrorMessage}`;
                    toast.error('Security error occurred');
            }
            
            await addMessage({
                type: 'ASSISTANT',
                content: assistantResponse,
                query: currentQuery
            }, sessionId || undefined);
            
        } else {
            const errorMessage = handleApiError(error);
            setError(errorMessage);
            
            await addMessage({
                type: 'ASSISTANT',
                content: `❌ Sorry, I encountered an error: ${errorMessage}`,
                query: currentQuery
            }, sessionId || undefined);
            
            toast.error('Query failed: ' + errorMessage);
        }
    } finally {
        setIsQuerying(false);
        isSubmittingRef.current = false;
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!isQuerying && !isSubmittingRef.current) {
        handleQuery();
      }
    }
  };

  const handleManualInput = () => {
    setIsVoiceChat(false);
    loadOrCreateSession();
    setChatHistory([]);
  }

  // Get cache status for current document
  const getCacheStatus = () => {
    if (!currentDocument) return null;
    return ragCache.getCached(currentDocument.id);
  };

  const cacheStatus = getCacheStatus();
  const cacheStats = ragCache.getStats();


    // Modified save file handler
    const handleSaveFileClick = () => {
      // Check if user has cloud storage access
      if (!hasCloudStorageAccess()) {
        // Show paywall modal
        setConfirmationModalConfig({
          header: 'Save to Cloud Storage',
          message: 'Save your documents securely to the cloud and access them from any device.',
          trueButton: 'Upgrade Now',
          falseButton: 'Cancel',
          type: ModalType.PAYWALL,
          onConfirm: () => {
            // This won't be called for paywall - upgrade button handles it
          },
          // Add paywall configuration
          paywall: {
            isPaywallFeature: true,
            userProfile: user,
            featureType: 'cloudStorage',
            onUpgrade: () => {
              // Redirect to pricing page
              window.location.href = '/frontend/pricing';
            },
            allowTemporary: true // Allow users to save temporarily
          }
        });
        return;
      }
  
      // If user has access, show regular save confirmation
      setConfirmationModalConfig({
        header: 'Save to Account',
        message: 'Save this document to your account for permanent access across all your devices. The document will be securely stored in cloud storage.',
        trueButton: 'Save File',
        falseButton: 'Cancel',
        type: ModalType.SAVE,
        onConfirm: handleSaveFile
      });
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
          documentId: currentDocument.id,
          document_id: currentDocument.id,
          title: currentDocument.originalFileName || currentDocument.fileName || 'Untitled',
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
      
      console.log('✅ Document saved successfully:', savedDocumentInfo);
      
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
  
  const truncateString = (str: string, maxLength: number) => {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength) + '...';
  }

  // Show SessionLoader when loading a session
  if (isLoadingSession && loadingSessionId) {
    return (
      <SessionLoader
        sessionTitle={loadingSessionInfo.title}
        documentName={loadingSessionInfo.documentName}
        stage={loadingStage}
      />
    );
  }

  const getClearSessionCallback = () => clearAllSessionState;

  return (
    <div className="h-full flex flex-col">
      {/* Fixed Document Header */}
      <div className="flex-shrink-0 bg-primary p-4">
        {isLoadingDocument ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm md:text-base mb-1 font-semibold text-foreground">Loading document...</h3>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></span>
                  Please wait while we prepare your document
                </p>
              </div>
            </div>
          </div>
        ) : currentDocument ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!documentExists && (
                <AlertCircle className="w-6 h-6 text-red-500" />
              )}
              <FileText className={`w-8 h-8 ${documentExists ? 'text-blue-600' : 'text-gray-400'}`} />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className={`text-sm md:text-base mb-1 font-semibold ${documentExists ? 'text-foreground' : 'text-muted-foreground'}`}>
                    <span className="block md:hidden">
                      {truncateString(currentDocument.fileName, 20)}
                    </span>
                    <span className="hidden md:block">
                      {currentDocument.fileName}
                    </span>
                    {!documentExists && ' (Document Deleted)'}
                  </h3>
                </div>
                <p className={`text-sm ${documentExists ? 'text-muted-foreground' : 'text-red-600'}`}>
                  {documentExists ? (
                    <span className="flex items-center gap-2">
                      {currentSessionId && currentDocument.status === 'INDEXED' ? (
                        <span className="px-2 py-1 text-xs bg-blue/20 text-blue-600 rounded-full font-medium">
                          Session Saved
                        </span>
                      ):(
                        <span className="px-2 py-1 text-xs bg-neutral/20 text-muted-foreground border-tertiary border-dashed border-2 rounded-full font-medium">
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
                onClick={handleSaveFileClick}
                disabled={!documentExists || currentDocument?.status === 'INDEXED'}
                className={`flex items-center p-2 px-3 text-sm rounded-lg transition-all duration-300 ${
                  !documentExists || currentDocument?.status === 'INDEXED'
                    ? 'bg-tertiary text-muted-foreground cursor-not-allowed'
                    : 'text-foreground hover:brightness-105 hover:bg-yellow-200/20 hover:text-yellow-600 cursor-pointer'
                }`}
              >
                {!documentExists
                  ? 'Unavailable'
                  : currentDocument?.status === 'INDEXED'
                    ? <><CloudCheck className="w-4 h-4 md:mr-1" /> <span className='hidden md:block'>Saved</span></>
                    : <><Cloud className="w-4 h-4 md:mr-1" /> <span className='hidden md:block'>Save File</span></>
                }
              </button>
              
              <button 
                onClick={currentDocument.status === 'TEMPORARY' ? () => openConfirmationModal(
                  {
                    header: 'Unsaved Files and Session',
                    message: 'You have unsaved changes. Are you sure you want to discard all files and start a new chat?',
                    trueButton: 'Discard All',
                    falseButton: 'Cancel',
                    type: ModalType.WARNING,
                  },
                  async () => {
                    if (currentSessionId) {
                      await handleDeleteSession(currentSessionId);
                    }
                    if (handleNewChat) {
                      handleNewChat();
                    }
                  }
                ) : () => {if (handleNewChat) {handleNewChat()}}}
                className="flex items-center cursor-pointer p-2 px-3 gap-1 text-sm bg-gradient-to-bl from-blue-500 to-indigo-700 hover:brightness-110 transition-all duration-300 text-white rounded-lg"
              >
                <DiamondPlus className="w-4 h-4" />
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

        {/* Chat Messages Container */}
        <ChatContainer
          chatHistory={chatHistory}
          isQuerying={isQuerying}
          documentExists={documentExists}
          onMessageAction={handleMessageAction}
        />

        {/* Input Area */}
        <div className="flex-shrink-0 bg-primary border-t border-tertiary p-6">
          {documentExists && (
            <div className='flex gap-4 mx-auto w-full relative'>
              <div className="flex-1">
                <textarea
                  value={query}
                  onKeyDown={handleKeyPress}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask a question about the uploaded document..."
                  rows={2}
                  className="w-full px-3 py-2 h-24 border border-tertiary rounded-xl focus:outline-none resize-none"
                />
              </div>
              <button
                onClick={handleVoiceModeClick}
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