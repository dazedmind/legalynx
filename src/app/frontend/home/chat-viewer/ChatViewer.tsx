// Updated ChatViewer.tsx with FIXED session creation workflow
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  AlertCircle,
  ArrowUp,
  Cloud,
  CloudDownload,
  DiamondPlus,
  Eye,
} from "lucide-react";
import {
  apiService,
  handleApiError,
  UploadResponse,
  isSecurityError,
  getSecurityErrorMessage,
  profileService,
} from "../../../../lib/api";
import { toast, Toaster } from "sonner";
import { useAuth } from "@/lib/context/AuthContext";
import { authUtils } from "@/lib/auth";
import { useRAGCache } from "@/lib/ragCacheService";
import ConfirmationModal from "../../components/layout/ConfirmationModal";
import { ChatContainer } from "./ChatContainer";
import SessionLoader from "../../components/layout/SessionLoader";
import { CloudCheck, AudioLines } from "lucide-react";
import { ModalType } from "../../components/layout/ConfirmationModal";
import VoiceChatComponent from "./VoiceChatComponent";
import { BiSolidFilePdf } from "react-icons/bi";
import { GoSquareFill } from "react-icons/go";
import { PDFViewer } from "../file-manager/PDFViewer";
import { HiOutlinePaperClip } from "react-icons/hi2";
import { Button } from "../../components/ui/button";

interface MessageBranch {
  content: string; // The edited version of the user message
  createdAt: Date;
  subsequentMessages: ChatMessage[]; // All assistant messages that followed this version
}

interface ChatMessage {
  id: string;
  type: "USER" | "ASSISTANT";
  content: string;
  createdAt: Date;
  query?: string;
  sourceCount?: number;
  isThinking?: boolean; // For pulse animation
  isStreaming?: boolean; // For streaming cursor animation
  branches?: MessageBranch[]; // Array of alternative conversation paths (for USER messages)
  currentBranch?: number; // Current branch index being displayed (0 = original, 1+ = edited versions)
  belongsToBranch?: {
    userMessageId: string;
    branchIndex: number;
  }; // For ASSISTANT messages that belong to a specific branch
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
  onSessionCreated?: () => void; // ✅ FIXED: Callback to refresh recent sessions
  onClearStateCallback?: (clearFn: () => void) => void;
}

type LoadingStage =
  | "loading_session"
  | "loading_document"
  | "loading_rag"
  | "preparing_chat";

// Helper function to reconstruct chat history with branches properly displayed
function reconstructChatHistoryWithBranches(messages: ChatMessage[]): ChatMessage[] {
  const result: ChatMessage[] = [];
  
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    
    // If this is a USER message with branches, show the current branch content
    if (msg.type === "USER" && msg.branches && msg.branches.length > 0 && msg.currentBranch !== undefined) {
      const currentBranch = msg.branches[msg.currentBranch];
      if (currentBranch) {
        // Add the user message with branch content
        result.push({
          ...msg,
          content: currentBranch.content,
        });
        
        // Add the subsequent messages from this branch
        // These messages are stored in the branch and were deleted from the main chat_messages table
        if (currentBranch.subsequentMessages && currentBranch.subsequentMessages.length > 0) {
          result.push(...currentBranch.subsequentMessages);
          
          // Skip any messages in the database that are already in subsequentMessages
          // to prevent duplicates (this can happen if messages were added to the branch later)
          const subsequentMessageIds = new Set(
            currentBranch.subsequentMessages.map((m: ChatMessage) => m.id)
          );
          
          let skippedCount = 0;
          while (i + 1 < messages.length) {
            const nextMsg = messages[i + 1];
            if (subsequentMessageIds.has(nextMsg.id)) {
              i++; // Skip this message as it's already in the branch
              skippedCount++;
            } else {
              // This is a new message not in the branch, stop skipping
              break;
            }
          }
          
          if (skippedCount > 0) {
            console.log(`🔀 Skipped ${skippedCount} duplicate messages already in branch ${msg.currentBranch}`);
          }
        }
      } else {
        // Branch index is invalid, just show the message as-is
        result.push(msg);
      }
    } else {
      // Regular message without branches
      result.push(msg);
    }
  }
  
  return result;
}

export default function ChatViewer({
  isSystemReady,
  onUploadSuccess,
  onSessionDelete,
  selectedSessionId,
  handleNewChat,
  handleVoiceChat,
  currentDocumentId,
  onClearStateCallback,
  lastUploadedDocumentId,
  onSessionCreated, // ✅ FIXED: Add callback prop
}: CombinedComponentProps & {
  onClearStateCallback?: (clearFn: () => void) => void;
}) {
  const { isAuthenticated, user } = useAuth();
  const ragCache = useRAGCache();

  // ✅ FIXED: Add refs for better state management
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveAttemptRef = useRef<number>(0);
  const pendingMessagesRef = useRef<ChatMessage[]>([]);

  // Add state to track if we're processing a new upload
  const [isProcessingNewUpload, setIsProcessingNewUpload] = useState(false);
  const [lastProcessedDocumentId, setLastProcessedDocumentId] = useState<
    string | null
  >(null);

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
  const [subscriptionStatus, setSubscriptionStatus] = useState("");
  const [isPDFViewerOpen, setIsPDFViewerOpen] = useState(false);
  const ragLoadingDocIdRef = useRef<string | null>(null);

  // ✅ NEW: Track RAG system loading state
  const [isLoadingRagSystem, setIsLoadingRagSystem] = useState(false);
  const [ragLoadingInfo, setRagLoadingInfo] = useState<{
    documentName?: string;
    operation?: "loading" | "reactivating" | "processing";
  }>({});

  // ✅ NEW: Token limit checking state
  const [tokenLimitInfo, setTokenLimitInfo] = useState<{
    tokensUsed: number;
    tokenLimit: number;
    resetTime: string | null;
    isLimitReached: boolean;
  }>({
    tokensUsed: 0,
    tokenLimit: 0,
    resetTime: null,
    isLimitReached: false,
  });

  // Loading stage tracking
  const [loadingStage, setLoadingStage] =
    useState<LoadingStage>("loading_session");
  const [loadingSessionInfo, setLoadingSessionInfo] = useState<{
    title?: string;
    documentName?: string;
  }>({});

  // Chat states
  const [query, setQuery] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const isSubmittingRef = useRef(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaveTimestamp, setLastSaveTimestamp] = useState(Date.now());
  const [uploadCompleted, setUploadCompleted] = useState(false);

  // ✅ NEW: Typing animation state
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);

  // ✅ NEW: AbortController for cancelling queries
  const [queryAbortController, setQueryAbortController] =
    useState<AbortController | null>(null);

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
      featureType?:
        | "saveSessions"
        | "cloudStorage"
        | "voiceMode"
        | "fileHistory"
        | "pdfDownload";
      onUpgrade?: () => void;
      allowTemporary?: boolean; // For features that can fallback to temporary
    };
  } | null>(null);

  // FIXED: Clear all session state when new document is uploaded
  const [pdfViewer, setPdfViewer] = useState<{
    isOpen: boolean;
    document: {
      id: string;
      fileName: string;
      originalFileName: string;
      size: number;
      uploadedAt: string;
      pages?: number;
      status: string;
      mimeType?: string;
    } | null;
  }>({ isOpen: false, document: null });

  const clearAllSessionState = () => {
    console.log("🧹 Clearing all session state for new upload");
    setCurrentSessionId(null);
    setChatHistory([]);
    setCurrentDocument(null);
    setQuery("");
    setError("");
    setDocumentExists(true); // Reset to true for new document
    setIsLoadingSession(false);
    setLoadingSessionId(null);
    setHasUnsavedChanges(false);
    setIsVoiceChat(false);

    // ✅ NEW: Clear RAG loading state
    setIsLoadingRagSystem(false);
    setRagLoadingInfo({});

    // ✅ NEW: Clear typing animation state
    setTypingMessageId(null);

    // Clear any cached RAG data
    ragCache.clearAll();
  };

  // Handler to open confirmation modal
  const openConfirmationModal = (
    config: {
      header: string;
      message: string;
      trueButton: string;
      falseButton: string;
      type: string;
    },
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
      try {
        const profile = await profileService.getProfile();
        setSubscriptionStatus(profile.subscription?.plan_type?.toUpperCase());

        // Get token limit information
        if (profile.subscription) {
          const resetTime = getNextResetTime(profile.subscription.plan_type);
          setTokenLimitInfo({
            tokensUsed: profile.subscription.tokens_used || 0,
            tokenLimit: profile.subscription.token_limit || 0,
            resetTime,
            isLimitReached:
              (profile.subscription.tokens_used || 0) >=
              (profile.subscription.token_limit || 0),
          });
        }
      } catch (error) {
        console.error("Failed to get subscription status:", error);
      }
    };
    getSubscriptionStatus();
  }, []);

  // ✅ NEW: Helper function to calculate next reset time based on subscription plan
  const getNextResetTime = (planType: string): string => {
    const now = new Date();
    let resetTime: Date;

    switch (planType?.toUpperCase()) {
      case "BASIC":
        // Basic plan resets every 24 hours
        resetTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case "STANDARD":
        // Standard plan resets every 12 hours
        resetTime = new Date(now.getTime() + 12 * 60 * 60 * 1000);
        break;
      case "PREMIUM":
        // Premium plan resets every 6 hours
        resetTime = new Date(now.getTime() + 6 * 60 * 60 * 1000);
        break;
      default:
        // Default to 24 hours reset
        resetTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }

    return resetTime.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const hasCloudStorageAccess = () => {
    if (!subscriptionStatus) return false;
    const plan = subscriptionStatus;
    if (plan === "BASIC") {
      return false;
    } else {
      return true;
    }
  };

  const handleVoiceModeClick = () => {
    const plan = subscriptionStatus;

    if (plan !== "PREMIUM") {
      setConfirmationModalConfig({
        header: "Voice Mode",
        message:
          "Interact with Legalynx AI using voice commands for a hands-free experience.",
        trueButton: "Upgrade to Premium",
        falseButton: "Cancel",
        type: ModalType.PAYWALL,
        onConfirm: () => {},
        paywall: {
          isPaywallFeature: true,
          userProfile: user,
          featureType: "voiceMode",
          onUpgrade: () => {
            window.location.href = "/frontend/pricing";
          },
          allowTemporary: false, // Voice mode has no fallback
        },
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
    console.log("🔍 Document loading effect:", {
      isSystemReady,
      currentDocument: currentDocument !== null,
      isResetting,
      user: !!user,
      uploadCompleted,
      isProcessingNewUpload,
      currentDocumentId, // 🔥 NEW: Added for tracking
      lastUploadedDocumentId, // 🔥 NEW: Added for tracking
    });

    // 🔥 FIXED: Only load if we don't have a current document and not resetting
    if (
      (currentDocument === null && !isResetting && !isProcessingNewUpload) ||
      uploadCompleted ||
      (currentDocumentId && currentDocument?.id !== currentDocumentId) ||
      (lastUploadedDocumentId && currentDocument?.id !== lastUploadedDocumentId)
    ) {
      console.log("📄 Loading current document...");
      loadCurrentDocument();

      // 🔥 FIXED: Defer state update to avoid setState during render
      if (uploadCompleted) {
        setTimeout(() => {
          setUploadCompleted(false);
        }, 0);
      }
    }
  }, [
    user,
    isResetting,
    currentDocument,
    uploadCompleted,
    isProcessingNewUpload,
    currentDocumentId,
    lastUploadedDocumentId,
  ]);

  useEffect(() => {
    console.log("🔍 Upload tracking effect:", {
      isSystemReady,
      isProcessingNewUpload,
      currentDocumentId,
      lastProcessedDocumentId,
      lastUploadedDocumentId,
    });

    // 🔥 FIXED: Defer state updates to avoid setState during render
    if (
      currentDocumentId &&
      currentDocumentId !== lastProcessedDocumentId &&
      !isProcessingNewUpload
    ) {
      console.log("📄 New document uploaded:", currentDocumentId);

      // Defer state updates to next tick to avoid setState during render
      setTimeout(() => {
        setIsProcessingNewUpload(true);
        setLastProcessedDocumentId(currentDocumentId);

        // Clear all previous state
        clearAllSessionState();

        // Load the new document
        loadCurrentDocument().finally(() => {
          setIsProcessingNewUpload(false);
        });
      }, 0);
    }

    // 🔥 FIXED: Also handle lastUploadedDocumentId changes with deferred state updates
    if (
      lastUploadedDocumentId &&
      lastUploadedDocumentId !== lastProcessedDocumentId &&
      !isProcessingNewUpload
    ) {
      console.log("📄 Last uploaded document changed:", lastUploadedDocumentId);

      // Defer state updates to next tick to avoid setState during render
      setTimeout(() => {
        setIsProcessingNewUpload(true);
        setLastProcessedDocumentId(lastUploadedDocumentId);

        // Clear all previous state
        clearAllSessionState();

        // Load the new document
        loadCurrentDocument().finally(() => {
          setIsProcessingNewUpload(false);
        });
      }, 0);
    }
  }, [
    currentDocumentId,
    lastProcessedDocumentId,
    isProcessingNewUpload,
    lastUploadedDocumentId,
  ]);

  // Register clear function with parent (defer to avoid setState during render)
  useEffect(() => {
    if (onClearStateCallback) {
      // Defer to next tick to avoid setState during render warning
      setTimeout(() => {
        onClearStateCallback(clearAllSessionState);
      }, 0);
    }
  }, [onClearStateCallback]);

  useEffect(() => {
    console.log("🔍 Upload success effect:", {
      isSystemReady,
      isProcessingNewUpload,
      currentDocumentId,
      lastProcessedDocumentId,
    });

    // If we have a new document ID that differs from last processed, handle the upload
    if (
      currentDocumentId &&
      currentDocumentId !== lastProcessedDocumentId &&
      !isProcessingNewUpload
    ) {
      console.log("📄 New document uploaded:", currentDocumentId);
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
    console.log("🔍 Upload success effect triggered");

    if (isSystemReady && !isResetting) {
      console.log("📄 Triggering loadCurrentDocument after upload success");
      loadCurrentDocument();
    }
  }, []);

  useEffect(() => {
    if (isResetting) return;
    if (
      selectedSessionId &&
      selectedSessionId !== currentSessionId &&
      selectedSessionId !== loadingSessionId &&
      !isLoadingSession
    ) {
      loadSpecificSession(selectedSessionId);
    }
  }, [
    selectedSessionId,
    currentSessionId,
    loadingSessionId,
    isLoadingSession,
    isResetting,
  ]);

  useEffect(() => {
    if (
      currentDocument &&
      user &&
      !currentSessionId &&
      documentExists &&
      !isResetting &&
      !isProcessingNewUpload
    ) {
      console.log("📝 Document loaded, creating/loading session...");
      loadOrCreateSession();
    }
  }, [
    currentDocument,
    user,
    currentSessionId,
    documentExists,
    isResetting,
    isProcessingNewUpload,
  ]);

  useEffect(() => {
    if (
      user &&
      isAuthenticated &&
      currentDocument &&
      documentExists &&
      !isResetting
    ) {
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
    // Also handle beforeunload for browser close/refresh
    const handleBeforeUnload = () => {
      if (hasUnsavedChanges && currentSessionId && chatHistory.length > 0) {
        // Use sendBeacon for more reliable saving on page unload
        const payload = JSON.stringify({
          title:
            chatHistory
              .find((m) => m.type === "USER")
              ?.content.substring(0, 50) || "Chat",
          updatedAt: new Date().toISOString(),
          isSaved: true,
        });

        navigator.sendBeacon(
          `/backend/api/chat-sessions/${currentSessionId}`,
          new Blob([payload], { type: "application/json" })
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges, currentSessionId, chatHistory.length]);

  useEffect(() => {
    // Clear any existing timeout
    if (saveTimeoutRef.current) { 
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (
      chatHistory.length > 0 &&
      currentSessionId &&
      user &&
      documentExists &&
      hasUnsavedChanges
    ) {
      console.log("⏱️ Scheduling save in 2 seconds...");

      saveTimeoutRef.current = setTimeout(() => {
        console.log("⏰ Auto-save timeout triggered");
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
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  };

  const checkDocumentExists = async (documentId: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `/backend/api/documents/check/${documentId}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      return response.ok;
    } catch (error) {
      console.log("Error checking document existence:", error);
      return false;
    }
  };

  // 🔥 NEW: Helper to resolve temporary doc_ IDs to database cuid IDs
  const resolveToDatabaseID = async (
    documentId?: string | null
  ): Promise<string | null> => {
    if (!documentId || typeof documentId !== "string") return null;

    // If already a database ID (cuid format), return as-is
    if (!documentId.startsWith("doc_")) {
      return documentId;
    }

    // For temporary doc_ IDs, look up the database ID from localStorage
    try {
      const storageKey =
        isAuthenticated && user?.id
          ? `uploaded_documents_${user.id}`
          : "uploaded_documents";

      const savedDocs = localStorage.getItem(storageKey);
      if (savedDocs) {
        const docs = JSON.parse(savedDocs);
        const doc = docs.find(
          (d: any) => d.id === documentId || d.documentId === documentId
        );

        if (doc && doc.databaseId) {
          console.log(
            `🔄 Resolved temp ID ${documentId} to database ID ${doc.databaseId}`
          );
          return doc.databaseId;
        }
      }

      console.warn(
        `⚠️ Could not resolve temporary ID ${documentId} to database ID`
      );
      return null;
    } catch (error) {
      console.error("❌ Error resolving document ID:", error);
      return null;
    }
  };

  const loadCurrentDocument = async () => {
    console.log("🔍 LOAD DOCUMENT STARTING:", {
      isResetting,
      hasCurrentDocument: currentDocument !== null,
      isAuthenticated,
      userId: user?.id,
      isProcessingNewUpload,
      lastUploadedDocumentId,
    });

    if (isResetting && !isProcessingNewUpload) {
      console.log("🚫 Skipping document load - currently resetting");
      return;
    }

    // ✅ FIXED: Set loading state at the beginning
    setIsLoadingDocument(true);
    let documentFound = false;

    // 🔥 STANDARDIZE: Always resolve to database ID before loading
    const resolvedDocumentId = await resolveToDatabaseID(currentDocumentId);
    if (resolvedDocumentId) {
      console.log(
        "🎯 Loading specific document by resolved ID:",
        resolvedDocumentId
      );
      await loadSpecificDocument(resolvedDocumentId);
      documentFound = true; // loadSpecificDocument will set state appropriately
      // ✅ FIXED: Clear loading state before early return
      setIsLoadingDocument(false);
      return;
    }

    // 🔥 STANDARDIZE: Resolve lastUploadedDocumentId to database ID
    const resolvedLastUploadedId = await resolveToDatabaseID(
      lastUploadedDocumentId
    );
    if (resolvedLastUploadedId) {
      console.log(
        "🎯 Loading last uploaded document by resolved ID:",
        resolvedLastUploadedId
      );
      await loadSpecificDocument(resolvedLastUploadedId);
      documentFound = true;
      // ✅ FIXED: Clear loading state before early return
      setIsLoadingDocument(false);
      return;
    }

    try {
      if (isAuthenticated && user) {
        console.log("👤 Checking API for documents...");
        const response = await fetch("/backend/api/documents", {
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          const data = await response.json();
          console.log("📄 API documents response:", data);

          if (data.documents && data.documents.length > 0) {
            const mostRecent = data.documents[0];
            console.log("📄 Most recent from API:", mostRecent);

            const exists = await checkDocumentExists(mostRecent.id);
            console.log("📄 Document exists check:", exists);

            if (exists && !isResetting) {
              const documentInfo = {
                id: mostRecent.id,
                fileName: mostRecent.fileName,
                originalFileName: mostRecent.originalFileName,
                fileSize: mostRecent.fileSize,
                uploadedAt: mostRecent.uploadedAt,
                pageCount: mostRecent.pageCount,
                status: mostRecent.status,
                databaseId: mostRecent.id,
              };

              console.log(
                "✅ Loading document from API:",
                documentInfo.originalFileName
              );
              setCurrentDocument(documentInfo);
              setDocumentExists(true);

              // 🚀 FAST REACTIVATION: Use faster method for existing documents
              try {
                console.log(
                  "⚡ Fast reactivation for document:",
                  documentInfo.fileName
                );
                await ragCache.reactivateDocument(
                  documentInfo.id,
                  documentInfo.fileName // Use fileName (already renamed) not originalFileName
                );
                console.log("✅ Document reactivated successfully");
              } catch (ragError) {
                console.error(
                  "❌ Failed to reactivate document:",
                  ragError
                );
                // Don't fail the whole operation, just log the error
              }

              documentFound = true;
              return;
            } else {
              console.log(
                "❌ Most recent document no longer exists or resetting"
              );
              // Do not set documentExists=false yet to avoid UI flicker; try localStorage next
            }
          } else {
            console.log("📄 No documents found in API");
          }
        } else {
          console.log("❌ API request failed:", response.status);
        }
      }

      // Check localStorage for both authenticated and non-authenticated users
      console.log("💿 Checking localStorage...");
      const storageKey =
        isAuthenticated && user?.id
          ? `uploaded_documents_${user.id}`
          : "uploaded_documents";
      console.log("💿 Storage key:", storageKey);

      const savedDocs = localStorage.getItem(storageKey);
      console.log("💿 Raw localStorage data:", savedDocs);

      if (savedDocs) {
        const docs = JSON.parse(savedDocs);
        console.log("💿 Parsed docs:", docs);

        if (docs.length > 0 && !isResetting) {
          const sortedDocs = docs.sort((a: any, b: any) => {
            const timeA = new Date(
              a.uploadedAt || a.uploaded_at || 0
            ).getTime();
            const timeB = new Date(
              b.uploadedAt || b.uploaded_at || 0
            ).getTime();
            return timeB - timeA;
          });

          const mostRecentDoc = sortedDocs[0];
          console.log("💿 Most recent from localStorage:", mostRecentDoc);

          const documentInfo = {
            id: mostRecentDoc.id || mostRecentDoc.documentId,
            fileName: mostRecentDoc.fileName || mostRecentDoc.filename,
            originalFileName:
              mostRecentDoc.originalFileName ||
              mostRecentDoc.original_file_name,
            fileSize:
              mostRecentDoc.fileSize ||
              mostRecentDoc.file_size ||
              mostRecentDoc.size,
            uploadedAt: mostRecentDoc.uploadedAt || mostRecentDoc.uploaded_at,
            pageCount:
              mostRecentDoc.pageCount ||
              mostRecentDoc.page_count ||
              mostRecentDoc.pages_processed,
            status: mostRecentDoc.status || "TEMPORARY",
            databaseId: mostRecentDoc.databaseId || mostRecentDoc.id,
          };

          console.log(
            "✅ Final document info from localStorage:",
            documentInfo
          );
          setCurrentDocument(documentInfo);
          setDocumentExists(true);

          // 🚀 FAST REACTIVATION: Use faster method for existing documents
          try {
            console.log(
              "⚡ Fast reactivation for document:",
              documentInfo.fileName
            );
            await ragCache.reactivateDocument(
              documentInfo.id,
              documentInfo.fileName // Use fileName (already renamed) not originalFileName
            );
            console.log("✅ Document reactivated successfully");
          } catch (ragError) {
            console.error(
              "❌ Failed to reactivate document:",
              ragError
            );
            // 🔥 GRACEFUL FALLBACK: If RAG loading fails, continue but warn user
            if (
              ragError instanceof Error &&
              ragError.message.includes("Could not find RAG ID")
            ) {
              console.warn(
                "⚠️ Document exists in database but not in RAG system. User can still view it but queries may not work until re-upload."
              );
              // Don't prevent the document from loading - user can still see it exists
            } else {
              // For other RAG errors, still don't fail the whole operation
              console.warn(
                "⚠️ RAG system error, continuing with document load"
              );
            }
          }

          documentFound = true;
        } else {
          console.log("💿 No documents in localStorage or resetting");
        }
      } else {
        console.log("💿 No localStorage data found");
      }
    } catch (error) {
      console.error("❌ Failed to load current document:", error);
      // Only set to false on errors after all checks
      setDocumentExists(false);
    }

    // If after all checks nothing was found, mark as not existing to avoid stale state
    if (!documentFound && !isResetting) {
      setDocumentExists(false);
      setCurrentDocument(null);
    }

    // ✅ FIXED: Always clear loading state at the end
    setIsLoadingDocument(false);
  };

  // 🔥 NEW: Load a specific document by ID
  const loadSpecificDocument = async (documentId: string) => {
    console.log("🎯 Loading specific document:", documentId);

    try {
      // First check localStorage
      const storageKey =
        isAuthenticated && user?.id
          ? `uploaded_documents_${user.id}`
          : "uploaded_documents";

      const savedDocs = localStorage.getItem(storageKey);
      if (savedDocs) {
        const docs = JSON.parse(savedDocs);
        const specificDoc = docs.find(
          (doc: any) => doc.id === documentId || doc.documentId === documentId
        );

        if (specificDoc) {
          console.log(
            "✅ Found specific document in localStorage:",
            specificDoc
          );

          const documentInfo = {
            id: specificDoc.id || specificDoc.documentId,
            fileName: specificDoc.fileName || specificDoc.filename,
            originalFileName:
              specificDoc.originalFileName || specificDoc.original_file_name,
            fileSize:
              specificDoc.fileSize || specificDoc.file_size || specificDoc.size,
            uploadedAt: specificDoc.uploadedAt || specificDoc.uploaded_at,
            pageCount:
              specificDoc.pageCount ||
              specificDoc.page_count ||
              specificDoc.pages_processed,
            status: specificDoc.status || "TEMPORARY",
            databaseId: specificDoc.databaseId || specificDoc.id,
          };

          setCurrentDocument(documentInfo);
          setDocumentExists(true);

          // 🚀 FAST REACTIVATION: Use faster method for existing documents
          try {
            console.log(
              "⚡ Fast reactivation for document:",
              documentInfo.fileName
            );
            await ragCache.reactivateDocument(
              documentInfo.id,
              documentInfo.fileName // Use fileName (already renamed) not originalFileName
            );
            console.log("✅ Document reactivated successfully");
          } catch (ragError) {
            console.error(
              "❌ Failed to reactivate document:",
              ragError
            );
            // Don't fail the whole operation, just log the error
          }

          return;
        }
      }

      // If not found in localStorage and user is authenticated, check API
      if (isAuthenticated && user) {
        console.log("🔍 Checking API for specific document:", documentId);
        const response = await fetch(`/backend/api/documents/${documentId}`, {
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          const documentData = await response.json();
          console.log("✅ Found specific document in API:", documentData);

          const documentInfo = {
            id: documentData.id,
            fileName: documentData.fileName,
            originalFileName: documentData.originalFileName,
            fileSize: documentData.fileSize,
            uploadedAt: documentData.uploadedAt,
            pageCount: documentData.pageCount,
            status: documentData.status,
            databaseId: documentData.id,
          };

          setCurrentDocument(documentInfo);
          setDocumentExists(true);

          // 🚀 FAST REACTIVATION: Use faster method for existing documents
          try {
            console.log(
              "⚡ Fast reactivation for document:",
              documentInfo.fileName
            );
            await ragCache.reactivateDocument(
              documentInfo.id,
              documentInfo.fileName // Use fileName (already renamed) not originalFileName
            );
            console.log("✅ Document reactivated successfully");
          } catch (ragError) {
            console.error(
              "❌ Failed to reactivate document:",
              ragError
            );
            // Don't fail the whole operation, just log the error
          }

          return;
        }
      }

      console.log("❌ Specific document not found:", documentId);
      setDocumentExists(false);
      setCurrentDocument(null);
    } catch (error) {
      console.error("❌ Failed to load specific document:", error);
      setDocumentExists(false);
      setCurrentDocument(null);
    }
  };

  const loadSpecificSession = async (sessionId: string) => {
    if (!user || isLoadingSession || loadingSessionId === sessionId) {
      console.log(
        "🚫 Skipping session load - already loading or same session:",
        {
          user: !!user,
          isLoadingSession,
          loadingSessionId,
          requestedSessionId: sessionId,
        }
      );
      return;
    }

    setIsLoadingSession(true);
    setLoadingSessionId(sessionId);
    setLoadingStage("loading_session");
    console.log("🔄 Loading specific session:", sessionId);

    try {
      setLoadingStage("loading_session");
      const response = await fetch(`/backend/api/chat/${sessionId}/messages`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const sessionData = await response.json();
        console.log("📄 Session data loaded:", sessionData);

        setLoadingSessionInfo({
          title:
            sessionData.title || `Chat with ${sessionData.document.fileName}`,
          documentName: sessionData.document.fileName,
        });

        setLoadingStage("loading_document");
        const docExists = await checkDocumentExists(sessionData.document.id);

        if (!docExists) {
          setDocumentExists(false);
          setCurrentDocument(null);
          setCurrentSessionId(null);
          setChatHistory([]);
          return;
        }

        // 🔥 FIX: Check if we're switching to a different document
        const newDocumentId = sessionData.document.id;
        const isDocumentSwitch =
          currentDocument && currentDocument.id !== newDocumentId;

        if (isDocumentSwitch) {
          console.log("🔄 Document switch detected:", {
            from: currentDocument.id,
            to: newDocumentId,
          });

          // 🔥 FIX: Clear RAG cache for previous document to force reload
          ragCache.clearDocument(currentDocument.id);

          console.log("🧹 Cleared RAG cache for document switch");
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
          databaseId: sessionData.document.id,
        };

        console.log("📁 Document info:", documentInfo);

        setLoadingStage("loading_rag");
        try {
          console.log("📤 Loading document into RAG system (fast reactivation)...");

          // Prevent duplicate loads for same document during fast refresh/double effects
          if (ragLoadingDocIdRef.current === sessionData.document.id) {
            console.log(
              "⏳ Skipping duplicate RAG load for document",
              sessionData.document.id
            );
          } else {
            ragLoadingDocIdRef.current = sessionData.document.id;

            // 🚀 FAST REACTIVATION: Use the faster reactivation method for session loading
            // This skips file renaming and uses the already-renamed fileName
            await ragCache.reactivateDocument(
              sessionData.document.id,
              documentInfo.fileName // Use fileName (already renamed) not originalFileName
            );

            ragLoadingDocIdRef.current = null;
          }
        } catch (pdfError) {
          console.error("❌ Failed to load PDF:", pdfError);

          const errorMessage =
            pdfError instanceof Error ? pdfError.message : "Unknown error";

          if (
            errorMessage.includes("not found") ||
            errorMessage.includes("404")
          ) {
            setDocumentExists(false);
          }

          // Show user-friendly error for document switching issues
          if (isDocumentSwitch) {
            toast.error(
              "Failed to switch document. Please try selecting it again."
            );
          } else {
            toast.error("Failed to load document. Please try again.");
          }

          // Don't return here - continue to load the session even if RAG loading fails
          console.log("⚠️ Continuing with session load despite RAG error");
        }

        setLoadingStage("preparing_chat");
        setCurrentDocument(documentInfo);

        const formattedMessages: ChatMessage[] = sessionData.messages.map(
          (msg: any) => ({
            id: msg.id,
            type: msg.role?.toUpperCase() as "USER" | "ASSISTANT",
            content: msg.content,
            createdAt: new Date(msg.created_at),
            sourceCount: msg.tokens_used,
            isThinking: false,
            isStreaming: false,
            // Load branches from database if they exist
            ...(msg.branches && {
              branches: msg.branches,
              currentBranch: msg.current_branch ?? 0,
            }),
          })
        );

        // Reconstruct chat history with branches properly displayed
        const reconstructedMessages = reconstructChatHistoryWithBranches(formattedMessages);
        setChatHistory(reconstructedMessages);

        await new Promise((resolve) => setTimeout(resolve, 500));

        // ✅ FIXED: Clear document loading state after session is fully loaded
        setIsLoadingDocument(false);
      } else if (response.status === 401) {
        toast.error("Authentication failed. Please sign in again.", {
          id: `loading-session-${sessionId}`,
        });
      } else if (response.status === 404) {
        toast.error("Chat session not found.", {
          id: `loading-session-${sessionId}`,
        });
        handleDocumentDeleted();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load session");
      }
    } catch (error) {
      console.error("❌ Failed to load specific session:", error);
      toast.error("Failed to load chat session", {
        id: `loading-session-${sessionId}`,
      });
      handleDocumentDeleted();
    } finally {
      setIsLoadingSession(false);
      setLoadingSessionId(null);
      setLoadingSessionInfo({});
      // ✅ FIXED: Always clear document loading state when session loading finishes
      setIsLoadingDocument(false);
    }
  };

  // Helper function to get session ID for RAG system
  const getSessionId = () => {
    return currentSessionId || `temp_${user?.id || "anonymous"}_${Date.now()}`;
  };

  // FIXED: Enhanced document verification and mismatch handling
  const verifyDocumentIsActive = async (
    documentId: string,
    maxRetries: number = 2
  ): Promise<void> => {
    try {
      const isDevelopment = process.env.NODE_ENV === "development";
      const RAG_BASE_URL = isDevelopment
        ? "http://localhost:8000"
        : process.env.NEXT_PUBLIC_RAG_API_URL;

      if (!RAG_BASE_URL) {
        console.warn("⚠️ RAG_BASE_URL not configured, skipping verification");
        return;
      }

      const sessionId =
        typeof window !== "undefined"
          ? localStorage.getItem("rag_session_id") || "default"
          : "default";

      const response = await fetch(`${RAG_BASE_URL}/current-document`, {
        method: "GET",
        headers: {
          // Avoid authorization for public RAG service to prevent CORS issues
          "X-Session-Id": sessionId,
        },
      });

      if (response.ok) {
        const currentDoc = await response.json();
        console.log("📄 RAG system current document:", currentDoc);
        console.log("📄 Expected document:", documentId);

        if (currentDoc.document_id && currentDoc.document_id !== documentId) {
          console.warn(
            `⚠️ Document mismatch! Expected: ${documentId}, Current: ${currentDoc.document_id}`
          );

          if (maxRetries > 0) {
            console.log(
              `🔄 Attempting to reload correct document (${maxRetries} retries left)`
            );

            // Clear cache and try to reload the correct document
            ragCache.clearDocument(documentId);

            // Force reload by clearing the document from RAG system first
            try {
              await fetch(`${RAG_BASE_URL}/reset`, {
                method: "DELETE",
                headers: { "X-Session-Id": sessionId },
              });
              console.log("🧹 Reset RAG system for clean reload");
            } catch (resetError) {
              console.warn("⚠️ Failed to reset RAG system:", resetError);
            }

            // Trigger a reload with retry
            throw new Error("DOCUMENT_MISMATCH_RETRY");
          } else {
            console.error("❌ Max retries exceeded for document mismatch");
            throw new Error(
              "Document mismatch could not be resolved after retries"
            );
          }
        } else {
          console.log(
            `✅ Document ${documentId} verified as active on backend`
          );
        }
      } else {
        console.warn(
          "⚠️ Could not verify document on backend, status:",
          response.status
        );
        // Don't throw error for verification failures - allow continued operation
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "DOCUMENT_MISMATCH_RETRY"
      ) {
        throw error; // Re-throw retry signal
      }
      console.warn("⚠️ Document verification failed:", error);
      // Don't throw error - allow operation to continue even if verification fails
    }
  };

  // FIXED: Enhanced loadPdfIntoRagSystemCached with retry logic
  const loadPdfIntoRagSystemCached = async (
    documentId: string,
    filename: string,
    forceReload: boolean = false
  ): Promise<void> => {
    // ✅ NEW: Set RAG loading state
    setIsLoadingRagSystem(true);
    setRagLoadingInfo({
      documentName: filename,
      operation: forceReload ? "reactivating" : "loading",
    });

    const getFileBlob = async (): Promise<Blob> => {
      // 🔥 STANDARDIZE: Always resolve to database ID for file operations
      const resolvedDocumentId = await resolveToDatabaseID(documentId);
      if (!resolvedDocumentId) {
        console.log(
          "🔍 Could not resolve document ID, checking if temporary RAG document"
        );

        // For temporary documents, we need to get them from the RAG system or localStorage
        // This is a placeholder - you might need to implement a different approach
        // for temporary documents that aren't in your database
        throw new Error(
          "Could not find RAG ID for database document. Document may need to be re-uploaded to work with AI features."
        );
      }

      const exists = await checkDocumentExists(resolvedDocumentId);
      if (!exists) {
        throw new Error("Document no longer exists in database");
      }

      const documentResponse = await fetch(
        `/backend/api/documents/${resolvedDocumentId}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!documentResponse.ok) {
        if (documentResponse.status === 404) {
          throw new Error("Document not found");
        }
        const errorData = await documentResponse.json();
        throw new Error(errorData.error || "Failed to get document details");
      }

      const fileResponse = await fetch(
        `/backend/api/documents/${resolvedDocumentId}/file`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!fileResponse.ok) {
        if (fileResponse.status === 404) {
          throw new Error("Document file not found in storage");
        }
        const errorData = await fileResponse.json();
        throw new Error(errorData.error || "Failed to get document file");
      }

      return fileResponse.blob();
    };

    try {
      // If force reload is requested, clear the cache first
      if (forceReload) {
        console.log(
          "🔄 Force reload requested, clearing cache for:",
          documentId
        );
        ragCache.clearDocument(documentId);
      }

      // For temporary documents, skip the blob loading and focus on RAG system
      if (
        documentId &&
        typeof documentId === "string" &&
        documentId.startsWith("doc_")
      ) {
        console.log("📝 Temporary document - checking RAG system directly");

        try {
          await verifyDocumentIsActive(documentId, 0); // No retries for temp docs
          console.log("✅ Temporary document verified in RAG system");
          return;
        } catch (verifyError) {
          console.warn("⚠️ Temporary document not in RAG system:", verifyError);
          // For temporary documents, we can't reload from database
          // The document should already be in the RAG system from upload
          toast.warning(
            "Document may need to be re-uploaded. Please try uploading again if queries fail."
          );
          return;
        }
      }

      // For database documents, proceed with normal loading
      await ragCache.loadDocument(documentId, filename, getFileBlob);

      // Verify the document was loaded correctly with retry logic
      let retryCount = 2;
      while (retryCount > 0) {
        try {
          await verifyDocumentIsActive(documentId, retryCount);
          break; // Success, exit retry loop
        } catch (verifyError) {
          if (
            verifyError instanceof Error &&
            verifyError.message === "DOCUMENT_MISMATCH_RETRY"
          ) {
            retryCount--;
            if (retryCount > 0) {
              console.log(
                `🔄 Retrying document load (${retryCount} attempts left)`
              );
              // Clear cache and retry
              ragCache.clearDocument(documentId);
              await ragCache.loadDocument(documentId, filename, getFileBlob);
            }
          } else {
            // Other errors - log but don't retry
            console.warn("⚠️ Document verification failed:", verifyError);
            break;
          }
        }
      }
    } catch (error) {
      console.error("❌ Failed to load PDF into RAG system:", error);

      // Provide user-friendly error messages
      let userMessage = "Failed to load document into AI system";

      if (error instanceof Error) {
        if (
          error.message.includes("not available") ||
          error.message.includes("Failed to fetch")
        ) {
          userMessage =
            "AI system is not available. Please ensure the backend service is running.";
          toast.error("AI system unavailable. Please contact support.");
        } else if (error.message.includes("Not Found")) {
          userMessage =
            "AI system endpoint not found. Please check the system configuration.";
          toast.error("AI system configuration error. Please contact support.");
        } else if (
          error.message.includes("empty") ||
          error.message.includes("corrupted")
        ) {
          userMessage =
            "Document file is corrupted or empty. Please re-upload the document.";
          toast.error("Document file is corrupted. Please re-upload.");
        } else if (
          error.message.includes(
            "Temporary documents should already be in RAG system"
          )
        ) {
          userMessage =
            "Temporary document not found in AI system. Please re-upload the document.";
          toast.warning("Please re-upload the document to continue chatting.");
        } else {
          userMessage = error.message;
          toast.error("Failed to load document into AI system");
        }
      }

      // Re-throw with user-friendly message
      throw new Error(userMessage);
    } finally {
      // ✅ NEW: Always clear RAG loading state
      setIsLoadingRagSystem(false);
      setRagLoadingInfo({});
    }
  };

  const loadChatHistoryFromDatabase = async () => {
    if (!user || !isAuthenticated || !currentDocument || !documentExists)
      return;

    try {
      const response = await fetch("/backend/api/chat", {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        const sessions = data.sessions || [];

        const documentSessions = sessions.filter(
          (session: any) => session.documentId === currentDocument.id
        );

        if (documentSessions.length > 0) {
          const mostRecentSession = documentSessions[0];

          const exists = await checkDocumentExists(currentDocument.id);
          if (!exists) {
            console.log("Document for session no longer exists");
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
              type: msg.role?.toUpperCase() as "USER" | "ASSISTANT",
              content: msg.content,
              createdAt: new Date(msg.created_at || msg.timestamp),
              sourceCount: msg.tokens_used,
              isThinking: false,
              isStreaming: false,
              // Load branches from database if they exist
              ...(msg.branches && {
                branches: msg.branches,
                currentBranch: msg.current_branch ?? 0,
              }),
            }));
            
            // Reconstruct chat history with branches properly displayed
            const reconstructedMessages = reconstructChatHistoryWithBranches(formattedMessages);
            setChatHistory(reconstructedMessages);
          }
        } else {
          setCurrentSessionId(null);
          setChatHistory([]);
        }
      }
    } catch (error) {
      console.error("Failed to load chat history from database:", error);
      setDocumentExists(false);
    }
  };

  // ✅ NEW: Function to update streaming message content
  const updateStreamingMessage = (messageId: string, content: string) => {
    setChatHistory((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, content } : msg
      )
    );
  };

  const addMessage = async (
    message: Omit<ChatMessage, "id" | "createdAt">,
    sessionIdOverride?: string
  ) => {
    if (!documentExists) {
      console.warn("Cannot add message - document does not exist");
      return;
    }

    const newMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };

    // Note: Typing animation removed - handled in streaming logic only

    // ✅ FIXED: Update state first
    setChatHistory((prev) => [...prev, newMessage]);
    setHasUnsavedChanges(true);

    // ✅ FIXED: Save individual message immediately to database
    const sessionIdToUse = sessionIdOverride ?? currentSessionId;

    if (
      sessionIdToUse &&
      typeof sessionIdToUse === "string" &&
      sessionIdToUse.trim() !== ""
    ) {
      try {
        console.log(
          "💾 Saving message to session immediately:",
          sessionIdToUse
        );
        const response = await fetch("/backend/api/chat-messages", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            id: newMessage.id,
            sessionId: sessionIdToUse,
            role: newMessage.type.toUpperCase(),
            content: newMessage.content,
            createdAt: newMessage.createdAt.toISOString(),
            tokensUsed: 0,
          }),
        });

        if (response.ok) {
          const savedMessage = await response.json();
          console.log(
            "✅ Message saved immediately:",
            savedMessage.messageId || savedMessage.id
          );

          // ✅ FIXED: Update session metadata immediately after message save
          setTimeout(() => {
            saveSessionToDatabase(true);
          }, 100);
        } else if (response.status === 404) {
          console.log("❌ Session not found, document may have been deleted");
          setDocumentExists(false);
          handleDocumentDeleted();
        } else {
          const errorData = await response.json();
          console.error("❌ Failed to save message:", errorData);
        }
      } catch (error) {
        console.error("❌ Failed to save message to database:", error);
      }
    } else {
      console.warn(
        "⚠️ Cannot save message - invalid or missing session ID:",
        sessionIdToUse
      );
    }

    return newMessage;
  };

  // ✅ FIXED: Modified loadOrCreateSession to immediately create session when none exists
  const loadOrCreateSession = async () => {
    if (!user || !currentDocument || isCreatingSession || !documentExists)
      return;

    // FIXED: Skip session loading if we're processing a new upload
    if (isProcessingNewUpload) {
      console.log("⏸️ Skipping session load - processing new upload");
      return;
    }

    try {
      setIsCreatingSession(true);
      // 🔥 STANDARDIZE: Always use database ID for session operations
      const documentId = await resolveToDatabaseID(
        currentDocument.databaseId || currentDocument.id
      );

      if (!documentId) {
        console.error("❌ Could not resolve document ID for session creation");
        setDocumentExists(false);
        handleDocumentDeleted();
        return;
      }

      console.log("🔍 Looking for existing session for document:", documentId);

      const exists = await checkDocumentExists(documentId);
      if (!exists) {
        console.log("❌ Document no longer exists");
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
        console.log("✅ Found existing session:", session.id);
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
              tokensUsed: msg.tokensUsed || msg.tokens_used,
              // Load branches from database if they exist
              ...(msg.branches && {
                branches: msg.branches,
                currentBranch: msg.current_branch ?? 0,
              }),
            }));

            // Reconstruct chat history with branches properly displayed
            const reconstructedMessages = reconstructChatHistoryWithBranches(formattedMessages);
            setChatHistory(reconstructedMessages);
            console.log(
              `📚 Loaded ${formattedMessages.length} existing messages (${reconstructedMessages.length} after branch reconstruction)`
            );
          }
        } catch (messageError) {
          console.error("Failed to load messages:", messageError);
        }
      } else if (response.status === 404) {
        // FIXED: For new uploads, immediately create session
        if (isProcessingNewUpload || lastProcessedDocumentId === documentId) {
          console.log(
            "📝 New upload detected - creating fresh session immediately"
          );
          const newSessionId = await createNewSession(documentId);

          if (!newSessionId) {
            console.error("❌ Failed to create new session");
            setDocumentExists(false);
            handleDocumentDeleted();
          } else {
            console.log(
              "✅ Created fresh session for new upload:",
              newSessionId
            );
            setChatHistory([]);
          }
        } else {
          console.log(
            "📝 No existing session found for existing document - this is normal for documents without chat history"
          );
          // Don't create a session automatically for existing documents
          // Let the user start chatting to create one
          setCurrentSessionId(null);
          setChatHistory([]);
        }
      } else {
        try {
          const errorText = await response.text();
          console.error("❌ Session lookup error details:", errorText);
        } catch (e) {
          console.error(
            "❌ Session lookup failed with status:",
            response.status
          );
        }

        // Don't immediately delete document on session errors
        // The document might still be valid, just no sessions exist
        if (response.status === 500) {
          console.warn(
            "⚠️ Server error during session lookup, but document may still be valid"
          );
          setCurrentSessionId(null);
          setChatHistory([]);
        } else {
          handleDocumentDeleted();
        }
      }
    } catch (error) {
      console.error("Failed to load or create session:", error);
      setDocumentExists(false);
      handleDocumentDeleted();
    } finally {
      setIsCreatingSession(false);
    }
  };

  // ✅ FIXED: Return session ID and handle async session creation properly
  const createNewSession = async (
    documentId?: string
  ): Promise<string | null> => {
    if (!user || !currentDocument || isCreatingSession || !documentExists)
      return null;

    try {
      setIsCreatingSession(true);
      // 🔥 STANDARDIZE: Always resolve to database ID for session creation
      const useDocumentId = await resolveToDatabaseID(
        documentId || currentDocument.databaseId || currentDocument.id
      );

      if (!useDocumentId) {
        console.error("❌ Could not resolve document ID for new session");
        toast.error("Document is not available for session creation");
        return null;
      }

      console.log("🆕 Creating new session for document:", useDocumentId);

      const exists = await checkDocumentExists(useDocumentId);
      if (!exists) {
        setDocumentExists(false);
        handleDocumentDeleted();
        return null;
      }

      const response = await fetch("/backend/api/chat-sessions", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userId: user.id,
          documentId: useDocumentId,
          title: `Chat with ${currentDocument.fileName}`,
          isSaved: false,
        }),
      });

      if (response.ok) {
        const session = await response.json();
        const newSessionId = session.id || session.sessionId;

        setCurrentSessionId(newSessionId);
        setChatHistory([]);
        console.log("✅ New chat session created:", newSessionId);
        
        // ✅ FIXED: Trigger callback to refresh recent sessions in sidebar
        if (onSessionCreated) {
          onSessionCreated();
        }
        
        return newSessionId;
      } else if (response.status === 404) {
        setDocumentExists(false);
        handleDocumentDeleted();
        return null;
      } else {
        const errorText = await response.text();
        console.error("Failed to create session:", errorText);
        throw new Error("Failed to create session");
      }
    } catch (error) {
      console.error("Failed to create session:", error);
      toast.error("Failed to create new chat session");
      setDocumentExists(false);
      handleDocumentDeleted();
      return null;
    } finally {
      setIsCreatingSession(false);
    }
  };

  const saveSessionToDatabase = async (force = false) => {
    if (
      !currentSessionId ||
      !user ||
      chatHistory.length === 0 ||
      !documentExists
    ) {
      console.log("Skipping save - missing requirements:", {
        currentSessionId: !!currentSessionId,
        user: !!user,
        chatHistoryLength: chatHistory.length,
        documentExists,
      });
      return;
    }

    if (
      typeof currentSessionId !== "string" ||
      currentSessionId.trim() === ""
    ) {
      console.error("Invalid session ID:", currentSessionId);
      return;
    }

    // ✅ FIXED: Prevent rapid successive saves
    const now = Date.now();
    if (!force && now - lastSaveAttemptRef.current < 500) {
      console.log("Skipping save - too soon after last attempt");
      return;
    }
    lastSaveAttemptRef.current = now;

    try {
      setIsSaving(true);

      const firstUserMessage = chatHistory.find((m) => m.type === "USER");
      const title = firstUserMessage
        ? `${firstUserMessage.content.substring(0, 50)}${
            firstUserMessage.content.length > 50 ? "..." : ""
          }`
        : `Chat with ${currentDocument?.fileName || "Document"}`;

      console.log("💾 Saving session:", {
        sessionId: currentSessionId,
        title,
        messageCount: chatHistory.length,
        force,
      });

      const response = await fetch(
        `/backend/api/chat-sessions/${currentSessionId}`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            title,
            updatedAt: new Date().toISOString(),
            isSaved: true,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.log(
            "Session no longer exists, document may have been deleted"
          );
          setDocumentExists(false);
          handleDocumentDeleted();
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save session");
      }

      const result = await response.json();
      console.log("✅ Session saved successfully:", result);

      setHasUnsavedChanges(false);
      setLastSaveTimestamp(Date.now());
    } catch (error) {
      console.error("❌ Failed to save session to database:", error);
      if (error instanceof Error && error.message.includes("not found")) {
        setDocumentExists(false);
        handleDocumentDeleted();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleMessageAction = async (
    action: string,
    messageId: string,
    content?: string
  ) => {
    switch (action) {
      case "copy":
        toast.success("Message copied to clipboard");
        break;
      case "thumbsUp":
        console.log("Thumbs up for message:", messageId);
        toast.success("Thanks for the feedback!");
        break;
      case "thumbsDown":
        console.log("Thumbs down for message:", messageId);
        toast.info("Thanks for the feedback. We'll work to improve.");
        break;
      case "regenerate":
        console.log("Regenerating message:", messageId);
        handleRegenerateResponse(messageId);
        break;
      case "edit":
        console.log("Editing message:", messageId);
        await handleEditMessage(messageId, content || "");
        break;
      case "delete":
        console.log("Deleting message:", messageId);
        await handleDeleteMessage(messageId);
        break;
      default:
        break;
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!newContent.trim()) {
      toast.error("Message cannot be empty");
      return;
    }

    try {
      setIsQuerying(true);

      // Find the message being edited
      const messageIndex = chatHistory.findIndex((msg) => msg.id === messageId);
      if (messageIndex === -1) {
        toast.error("Message not found");
        return;
      }

      const messageToEdit = chatHistory[messageIndex];
      if (messageToEdit.type !== "USER") {
        toast.error("Only user messages can be edited");
        return;
      }

      // Get ALL subsequent messages (USER and ASSISTANT) - these will be stored in branches
      const subsequentMessages = chatHistory.slice(messageIndex + 1);

      console.log(`🌿 Creating branch for edit. Subsequent messages to preserve: ${subsequentMessages.length}`);

      // If this is the first edit, create a branch for the original content
      let branches = messageToEdit.branches || [];
      let currentBranch = messageToEdit.currentBranch ?? 0;

      if (branches.length === 0) {
        // First edit - save the original as branch 0
        console.log("📝 First edit - saving original content as branch 0");
        branches.push({
          content: messageToEdit.content,
          createdAt: messageToEdit.createdAt instanceof Date 
            ? messageToEdit.createdAt 
            : new Date(messageToEdit.createdAt),
          subsequentMessages: subsequentMessages
        });
      }

      // Create new branch with the edited content (empty subsequent messages for now)
      const newBranch: MessageBranch = {
        content: newContent,
        createdAt: new Date(),
        subsequentMessages: [] // Will be filled when we generate the response
      };
      branches.push(newBranch);
      currentBranch = branches.length - 1; // Switch to the new branch

      console.log(`🌿 Created branch ${currentBranch}. Total branches: ${branches.length}`);

      // Update the message with branches
      const updatedMessage = {
        ...messageToEdit,
        content: newContent, // Show the edited content
        branches: branches,
        currentBranch: currentBranch,
      };

      // CRITICAL: Save branches to database BEFORE deleting subsequent messages
      // This ensures data isn't lost if something goes wrong
      try {
        console.log('💾 Saving branches to database BEFORE deleting subsequent messages');
        const response = await fetch(`/backend/api/chat-messages/${messageId}`, {
          method: "PATCH",
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: newContent,
            branches: branches,
            currentBranch: currentBranch,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('⚠️ Failed to save branches to database:', errorText);
          throw new Error('Failed to save branches before deletion');
        }

        console.log(`✅ Branches saved to database (${branches.length} branches, current: ${currentBranch})`);
      } catch (err) {
        console.error('❌ Error saving branches:', err);
        toast.error('Failed to save branches - aborting edit');
        throw err; // Abort the edit if we can't save branches
      }

      // Update chat history - keep only messages up to the edited one
      // Remove subsequent messages (they're now stored in branches)
      const messagesBeforeEdit = chatHistory.slice(0, messageIndex);
      const subsequentMessagesToDelete = chatHistory.slice(messageIndex + 1);

      // NOW it's safe to delete subsequent messages from database
      // (they're already preserved in the branch's subsequentMessages and saved to DB)
      if (subsequentMessagesToDelete.length > 0) {
        console.log(`🗑️ Deleting ${subsequentMessagesToDelete.length} subsequent messages from database`);
        for (const msgToDelete of subsequentMessagesToDelete) {
          try {
            const deleteResponse = await fetch(`/backend/api/chat-messages/${msgToDelete.id}`, {
              method: 'DELETE',
              headers: getAuthHeaders()
            });

            if (deleteResponse.ok) {
              console.log(`✅ Deleted message ${msgToDelete.id} from database`);
            } else {
              console.warn(`⚠️ Failed to delete message ${msgToDelete.id} from database`);
            }
          } catch (deleteErr) {
            console.error(`❌ Error deleting message ${msgToDelete.id}:`, deleteErr);
            // Don't abort - the branch is already saved
          }
        }
      }

      setChatHistory([...messagesBeforeEdit, updatedMessage]);

      // Generate new response based on the edited message using streaming
      const newMessageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      let streamedContent = "";
      let sourceCount = 0;

      // Calculate timestamp for new assistant response (1ms after edited message to maintain order)
      const editedMessageDate = messageToEdit.createdAt instanceof Date 
        ? messageToEdit.createdAt 
        : new Date(messageToEdit.createdAt);
      const newAssistantTimestamp = new Date(editedMessageDate.getTime() + 1);

      // Add a thinking message immediately
      setChatHistory((prev) => [
        ...prev,
        {
          id: newMessageId,
          type: "ASSISTANT",
          content: "Regenerating response...",
          createdAt: newAssistantTimestamp,
          isThinking: true,
          isStreaming: true,
        },
      ]);

      const ragClient = new (await import('../../utils/api-client')).RAGApiClient();

      let finalResponseContent = '';

      await ragClient.streamQueryDocument(
        newContent,
        (chunk) => {
          if (chunk.type === 'content_chunk') {
            if (chunk.partial_response !== undefined) {
              streamedContent = chunk.partial_response;
              finalResponseContent = streamedContent;

              setChatHistory((prev) =>
                prev.map((msg) =>
                  msg.id === newMessageId
                    ? {
                        ...msg,
                        content: streamedContent,
                        isThinking: false,
                        isStreaming: true,
                      }
                    : msg
                )
              );
            }
          } else if (chunk.type === 'sources') {
            sourceCount = chunk.source_count || 0;
          } else if (chunk.type === 'complete' || chunk.type === 'end') {
            finalResponseContent = chunk.response || streamedContent;
            setChatHistory((prev) =>
              prev.map((msg) =>
                msg.id === newMessageId
                  ? {
                      ...msg,
                      content: finalResponseContent,
                      query: newContent,
                      sourceCount: sourceCount,
                      isStreaming: false,
                      isThinking: false,
                    }
                  : msg
              )
            );
          }
        },
        (error) => {
          console.error("Streaming error:", error);
          setChatHistory((prev) => prev.filter((msg) => msg.id !== newMessageId));
          setError(error.message);
          toast.error("Failed to regenerate response: " + error.message);
        }
      );

      // Store the new assistant response in the current branch and update state
      // IMPORTANT: We need to save branches after capturing them
      let branchesToSave: MessageBranch[] | undefined = undefined;
      let currentBranchToSave: number | undefined = undefined;

      // Build the updated messages and capture branches
      await new Promise<void>((resolve) => {
        setChatHistory((prev) => {
          console.log(`🔍 Looking for message ${messageId} to update with assistant response`);
          console.log(`   Chat history has ${prev.length} messages`);

          const updatedMessages = prev.map((msg) => {
            if (msg.id === messageId) {
              console.log(`✓ Found user message ${messageId}`);
              console.log(`   Has branches: ${!!msg.branches}`);
              console.log(`   Branches length: ${msg.branches?.length || 0}`);
              console.log(`   Current branch: ${msg.currentBranch}`);
            }

            if (msg.id === messageId && msg.branches && msg.currentBranch !== undefined) {
              // Find the assistant message in chat history
              const assistantMsg = prev.find(m => m.id === newMessageId);
              console.log(`🔍 Looking for assistant message ${newMessageId}`);
              console.log(`   Found: ${!!assistantMsg}`);

              if (assistantMsg) {
                console.log(`   Assistant content length: ${assistantMsg.content?.length || 0} chars`);
                // Update the branch to include the new response
                const updatedBranches = [...msg.branches];
                if (updatedBranches[msg.currentBranch]) {
                  updatedBranches[msg.currentBranch] = {
                    ...updatedBranches[msg.currentBranch],
                    subsequentMessages: [{
                      ...assistantMsg,
                      isStreaming: false,
                      isThinking: false,
                    }]
                  };
                }

                // Store for database save
                branchesToSave = updatedBranches;
                currentBranchToSave = msg.currentBranch;
                console.log(`✅ Captured branches for save: ${branchesToSave.length} branches`);

                return {
                  ...msg,
                  branches: updatedBranches
                };
              } else {
                console.error(`❌ Assistant message ${newMessageId} NOT FOUND in chat history!`);
                console.log(`   Available message IDs:`, prev.map(m => `${m.id} (${m.type})`));
              }
            }

            // Clear streaming state for the assistant message
            if (msg.id === newMessageId) {
              return {
                ...msg,
                isStreaming: false,
                isThinking: false,
              };
            }

            return msg;
          });

          // Reconstruct chat history to properly display branches
          console.log('🔄 Reconstructing chat history after edit');
          const result = reconstructChatHistoryWithBranches(updatedMessages);
          
          // Resolve promise after state update is complete
          setTimeout(() => resolve(), 0);
          
          return result;
        });
      });

      // Update database with the NEW assistant response added to the branch
      console.log('💾 Checking if we can save branches after edit...');
      console.log(`   currentSessionId: ${currentSessionId}`);
      console.log(`   user: ${!!user}`);
      console.log(`   documentExists: ${documentExists}`);
      console.log(`   branchesToSave: ${!!branchesToSave}`);
      if (branchesToSave && Array.isArray(branchesToSave)) {
        console.log(`   currentBranchToSave: ${currentBranchToSave}`);
      }

      if (currentSessionId && user && documentExists && branchesToSave) {
        console.log('💾 Updating branches with new assistant response after edit');
        try {
          const response = await fetch(`/backend/api/chat-messages/${messageId}`, {
            method: "PATCH",
            headers: {
              ...getAuthHeaders(),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              content: newContent,
              branches: branchesToSave,
              currentBranch: currentBranchToSave,
            }),
          });

          if (!response.ok) {
            console.warn('⚠️ Failed to update branches with new response, but continuing');
          } else {
            console.log('✅ Branches updated with new assistant response');
          }
        } catch (err) {
          console.error('❌ Error updating branches with new response:', err);
        }
      } else {
        console.warn('⚠️ Cannot save branches - missing required data');
      }

      console.log('✅ Branch updated with new response');
      toast.success("Message edited - new branch created!");
    } catch (error) {
      console.error("Edit message error:", error);
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      toast.error("Failed to regenerate response: " + errorMessage);

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
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        setSavedSessions((prev) => prev.filter((s) => s.id !== sessionId));
        onSessionDelete?.(sessionId);
        toast.success("Chat session deleted successfully");
      } else {
        throw new Error("Failed to delete session");
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
      toast.error("Failed to delete chat session");
    }
  };

  const handleRegenerateResponse = async (messageId: string) => {
    const messageIndex = chatHistory.findIndex((msg) => msg.id === messageId);
    if (messageIndex === -1) return;

    const assistantMessage = chatHistory[messageIndex];
    if (assistantMessage.type !== "ASSISTANT") return;

    try {
      setIsQuerying(true);

      // Find the root USER message that has (or should have) branches
      // We need to search backwards to find a USER message, which might be before this assistant message
      let rootUserMessage: ChatMessage | null = null;
      let rootUserMessageIndex = -1;
      
      for (let i = messageIndex - 1; i >= 0; i--) {
        if (chatHistory[i].type === "USER") {
          rootUserMessage = chatHistory[i];
          rootUserMessageIndex = i;
          break;
        }
      }

      if (!rootUserMessage) {
        toast.error("Could not find user message to regenerate from");
        return;
      }

      console.log(`🔄 Regenerating response. Root user message: ${rootUserMessage.id}, Current branch: ${rootUserMessage.currentBranch}`);

      // Get all subsequent messages after the assistant message (these will be discarded)
      const subsequentMessages = chatHistory.slice(messageIndex + 1);
      
      // Initialize or update branches
      let userBranches = rootUserMessage.branches || [];
      let currentBranchIndex = rootUserMessage.currentBranch ?? 0;

      if (userBranches.length === 0) {
        // First time branching - save the original as branch 0
        console.log("📝 First regeneration - saving original as branch 0");
        userBranches.push({
          content: rootUserMessage.content,
          createdAt: rootUserMessage.createdAt instanceof Date 
            ? rootUserMessage.createdAt 
            : new Date(rootUserMessage.createdAt),
          subsequentMessages: [assistantMessage, ...subsequentMessages]
        });
      } else {
        // Update the CURRENT branch with the old response (preserve it before creating new branch)
        userBranches[currentBranchIndex] = {
          ...userBranches[currentBranchIndex],
          subsequentMessages: [assistantMessage, ...subsequentMessages]
        };
      }

      // Create NEW branch for the regenerated response (always a sibling branch)
      const newBranchIndex = userBranches.length;
      userBranches.push({
        content: rootUserMessage.content, // Same prompt, different response
        createdAt: new Date(),
        subsequentMessages: [] // Will be filled with the new response
      });

      console.log(`🌿 Created branch ${newBranchIndex} for regeneration. Total branches: ${userBranches.length}`);

      // Update the root user message with all branches
      const updatedUserMessage = {
        ...rootUserMessage,
        branches: userBranches,
        currentBranch: newBranchIndex, // Switch to the new branch
      };

      // CRITICAL: Save branches with OLD response to database BEFORE deleting assistant messages
      // This ensures the original response is preserved
      // NOTE: The NEW regenerated response will be saved after streaming completes
      try {
        console.log('💾 Step 1: Saving branches with ORIGINAL response BEFORE deleting messages');
        console.log(`   Saving ${userBranches.length} branches (branch ${currentBranchIndex} has original response)`);

        // Verify the original response is in the current branch
        if (userBranches[currentBranchIndex]?.subsequentMessages) {
          console.log(`   Branch ${currentBranchIndex} has ${userBranches[currentBranchIndex].subsequentMessages.length} subsequent messages`);
        }

        const response = await fetch(`/backend/api/chat-messages/${rootUserMessage.id}`, {
          method: "PATCH",
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: rootUserMessage.content,
            branches: userBranches,
            currentBranch: newBranchIndex, // Point to the NEW branch (which is empty for now)
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('⚠️ Failed to save branches to database:', errorText);
          throw new Error('Failed to save branches before deletion');
        }

        console.log(`✅ Step 1 Complete: Original response saved in branch ${currentBranchIndex}`);
        console.log(`   Branch ${newBranchIndex} is empty and will be filled after streaming`);
      } catch (err) {
        console.error('❌ Error saving branches:', err);
        toast.error('Failed to save branches - aborting regeneration');
        throw err; // Abort the regeneration if we can't save branches
      }

      // NOW it's safe to delete the old assistant message from database
      // (it's already preserved in the branch's subsequentMessages and saved to DB)
      try {
        await fetch(`/backend/api/chat-messages/${messageId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        console.log(`🗑️ Deleted old assistant message ${messageId} from database`);
      } catch (deleteErr) {
        console.error(`❌ Error deleting assistant message:`, deleteErr);
        // Don't abort - the branch is already saved, so this is recoverable
      }

      if (subsequentMessages.length > 0) {
        console.log(`🗑️ Deleting ${subsequentMessages.length} subsequent messages from database`);
        for (const msgToDelete of subsequentMessages) {
          try {
            await fetch(`/backend/api/chat-messages/${msgToDelete.id}`, {
              method: 'DELETE',
              headers: getAuthHeaders()
            });
          } catch (deleteErr) {
            console.error(`❌ Error deleting subsequent message:`, deleteErr);
            // Don't abort - the branch is already saved
          }
        }
      }

      // Update chat history - keep only messages up to and including the updated user message
      // Reconstruct to ensure branches are displayed properly
      const messagesBeforeAssistant = chatHistory.slice(0, rootUserMessageIndex);
      const initialUpdateMessages = [...messagesBeforeAssistant, updatedUserMessage];
      setChatHistory(reconstructChatHistoryWithBranches(initialUpdateMessages));

      // Generate new response
      const newAssistantMessageId = crypto.randomUUID();
      let streamedContent = "";
      let sourceCount = 0;

      // Add thinking message
      setChatHistory((prev) => [
        ...prev,
        {
          id: newAssistantMessageId,
          type: "ASSISTANT",
          content: "Generating alternative response...",
          createdAt: new Date(),
          isThinking: true,
          isStreaming: true,
        },
      ]);

      const ragClient = new (await import('../../utils/api-client')).RAGApiClient();

      // Stream the alternative response
      await ragClient.streamQueryDocument(
        rootUserMessage.content,
        (chunk) => {
          if (chunk.type === 'content_chunk') {
            if (chunk.partial_response !== undefined) {
              streamedContent = chunk.partial_response;

              setChatHistory((prev) =>
                prev.map((msg) =>
                  msg.id === newAssistantMessageId
                    ? {
                        ...msg,
                        content: streamedContent,
                        isThinking: false,
                        isStreaming: true,
                      }
                    : msg
                )
              );
            }
          } else if (chunk.type === 'sources') {
            sourceCount = chunk.source_count || 0;
          } else if (chunk.type === 'complete' || chunk.type === 'end') {
            streamedContent = chunk.response || streamedContent;
          }
        },
        (error) => {
          console.error("Streaming error:", error);
          setError(error.message);
          toast.error("Failed to regenerate response: " + error.message);
          setChatHistory((prev) => prev.filter(msg => msg.id !== newAssistantMessageId));
        }
      );

      // Update the new branch with the regenerated response and save to database
      let finalUpdatedBranches: MessageBranch[] = [];
      let updatedUserMessageWithBranches: ChatMessage | null = null;

      setChatHistory((prev) => {
        // First, update messages with branch data
        console.log(`🔍 Searching for assistant message with ID: ${newAssistantMessageId}`);
        console.log(`   Current chat history has ${prev.length} messages`);

        const updatedMessages = prev.map((msg) => {
          if (msg.id === rootUserMessage!.id) {
            const updatedBranches = [...userBranches]; // Use the userBranches we created above
            const assistantMsg = prev.find(m => m.id === newAssistantMessageId);

            console.log(`🔍 Found assistant message: ${!!assistantMsg}`);
            if (assistantMsg) {
              console.log(`   Assistant content length: ${assistantMsg.content?.length || 0}`);
              console.log(`   Assistant content preview: "${assistantMsg.content?.substring(0, 100)}..."`);
            } else {
              console.error(`❌ Could not find assistant message with ID ${newAssistantMessageId}`);
              console.log('   Available message IDs:', prev.map(m => m.id));
            }

            if (assistantMsg && updatedBranches[newBranchIndex]) {
              // Add the new response to the new branch
              updatedBranches[newBranchIndex] = {
                ...updatedBranches[newBranchIndex],
                subsequentMessages: [{
                  ...assistantMsg,
                  content: streamedContent,
                  sourceCount: sourceCount,
                  isStreaming: false,
                  isThinking: false,
                }]
              };

              console.log(`✅ Added assistant response to branch ${newBranchIndex}`);
              console.log(`   Subsequent messages in branch: ${updatedBranches[newBranchIndex].subsequentMessages.length}`);

              // Store for saving after state update
              finalUpdatedBranches = updatedBranches;

              const updatedMsg = {
                ...msg,
                branches: updatedBranches,
                currentBranch: newBranchIndex, // Update to show the new branch
              };

              // Store the updated user message for database save
              updatedUserMessageWithBranches = updatedMsg;

              return updatedMsg;
            } else if (!assistantMsg) {
              console.error(`❌ Cannot add to branch - assistant message not found`);
            } else if (!updatedBranches[newBranchIndex]) {
              console.error(`❌ Cannot add to branch - branch ${newBranchIndex} does not exist`);
            }
          }

          // Clear streaming state for the new assistant message
          if (msg.id === newAssistantMessageId) {
            return {
              ...msg,
              content: streamedContent,
              sourceCount: sourceCount,
              isStreaming: false,
              isThinking: false,
            };
          }

          return msg;
        });

        // IMPORTANT: Don't filter out the assistant message yet - let reconstructChatHistoryWithBranches handle it
        // The reconstruction will show the message from the branch's subsequentMessages
        console.log('🔄 Reconstructing chat history after regeneration');
        console.log(`📊 Final branches before reconstruction: ${finalUpdatedBranches.length} branches`);
        if (finalUpdatedBranches.length > 0) {
          console.log(`   Branch ${newBranchIndex} has ${finalUpdatedBranches[newBranchIndex]?.subsequentMessages?.length || 0} subsequent messages`);
        }

        // Filter out the new assistant message since it's now in branches
        const messagesWithoutDuplicate = updatedMessages.filter(m => m.id !== newAssistantMessageId);
        console.log(`   Filtered out duplicate assistant message. Messages count: ${updatedMessages.length} -> ${messagesWithoutDuplicate.length}`);

        return reconstructChatHistoryWithBranches(messagesWithoutDuplicate);
      });

      // Step 2: Update the database with the NEW regenerated response
      console.log('\n💾 Step 2: Preparing to save REGENERATED response to database');
      console.log(`   finalUpdatedBranches.length: ${finalUpdatedBranches.length}`);
      console.log(`   newBranchIndex: ${newBranchIndex}`);
      console.log(`   rootUserMessage.id: ${rootUserMessage.id}`);

      if (finalUpdatedBranches.length > 0 && finalUpdatedBranches[newBranchIndex]) {
        const branchToSave = finalUpdatedBranches[newBranchIndex];
        console.log(`   Branch ${newBranchIndex} subsequentMessages: ${branchToSave.subsequentMessages?.length || 0}`);

        if (branchToSave.subsequentMessages && branchToSave.subsequentMessages.length > 0) {
          const msg = branchToSave.subsequentMessages[0];
          console.log(`   Assistant message ID: ${msg.id}`);
          console.log(`   Assistant message content length: ${msg.content?.length || 0} chars`);
          console.log(`   Assistant message preview: "${msg.content?.substring(0, 100)}..."`);
        } else {
          console.error(`   ❌ ERROR: Branch ${newBranchIndex} has NO subsequent messages!`);
        }

        try {
          console.log('💾 Step 2: Sending PATCH request to update branches with REGENERATED response');
          const response = await fetch(`/backend/api/chat-messages/${rootUserMessage.id}`, {
            method: "PATCH",
            headers: {
              ...getAuthHeaders(),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              content: rootUserMessage.content,
              branches: finalUpdatedBranches,
              currentBranch: newBranchIndex,
            }),
          });

          if (response.ok) {
            console.log(`✅ Step 2 Complete: Regenerated response saved!`);
            console.log(`   Total branches: ${finalUpdatedBranches.length}`);
            console.log(`   Current branch: ${newBranchIndex}`);

            // Verify by reading back from database
            try {
              console.log('\n🔍 Verifying saved data in database...');
              const verifyResponse = await fetch(`/backend/api/chat-messages/${rootUserMessage.id}`, {
                headers: getAuthHeaders()
              });
              if (verifyResponse.ok) {
                const savedMessage = await verifyResponse.json();
                console.log(`✅ Verification Success: Message has ${savedMessage.branches?.length || 0} branches in database`);

                // Check each branch
                if (savedMessage.branches) {
                  savedMessage.branches.forEach((branch: any, idx: number) => {
                    const msgCount = branch.subsequentMessages?.length || 0;
                    const hasContent = msgCount > 0;
                    console.log(`   Branch ${idx}: ${msgCount} messages, ${hasContent ? '✅ HAS CONTENT' : '❌ EMPTY'}`);
                    if (hasContent && branch.subsequentMessages[0]) {
                      const contentPreview = branch.subsequentMessages[0].content?.substring(0, 50) || '';
                      console.log(`      Preview: "${contentPreview}..."`);
                    }
                  });
                }
              }
            } catch (verifyErr) {
              console.warn('Could not verify saved branches:', verifyErr);
            }
          } else {
            const errorText = await response.text();
            console.error('⚠️ Failed to update branches with new response:', errorText);
            toast.error('Failed to save regenerated response to database');
          }
        } catch (err) {
          console.error('❌ Error updating branches with new response:', err);
          toast.error('Error saving regenerated response');
        }
      } else {
        console.error('❌ CRITICAL: No finalUpdatedBranches to save or branch is empty!');
        console.error(`   This means the assistant response was not captured properly`);
        console.error(`   streamedContent length: ${streamedContent.length}`);
        toast.error('Failed to save regenerated response - data not captured');
      }

      toast.success(`Response regenerated! Now on Branch ${newBranchIndex + 1}`);
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      toast.error("Failed to regenerate response");
    } finally {
      setIsQuerying(false);
    }
  };

  // Handle branch navigation
  const handleBranchChange = async (messageId: string, newBranchIndex: number) => {
    console.log('🔀 Branch change requested:', { messageId, newBranchIndex });

    setChatHistory((prev) => {
      const msgIndex = prev.findIndex((msg) => msg.id === messageId);

      if (msgIndex === -1) {
        console.warn('⚠️ Message not found');
        return prev;
      }

      const currentMsg = prev[msgIndex];

      if (!currentMsg.branches || currentMsg.branches.length === 0) {
        console.warn('⚠️ No branches available');
        return prev;
      }

      if (newBranchIndex < 0 || newBranchIndex >= currentMsg.branches.length) {
        console.warn('⚠️ Invalid branch index:', newBranchIndex);
        return prev;
      }

      const selectedBranch = currentMsg.branches[newBranchIndex];
      console.log(`🌿 Switching to branch ${newBranchIndex}:`, {
        content: selectedBranch.content.substring(0, 50),
        subsequentMessages: selectedBranch.subsequentMessages.length
      });

      // Get all messages before the edited one
      const messagesBeforeEdit = prev.slice(0, msgIndex);

      // Update the edited message with the selected branch content
      const updatedMessage = {
        ...currentMsg,
        content: selectedBranch.content,
        currentBranch: newBranchIndex,
      };

      // Combine: messages before + edited message + branch's subsequent messages
      const newHistory = [
        ...messagesBeforeEdit,
        updatedMessage,
        ...selectedBranch.subsequentMessages
      ];

      console.log(`✅ Switched to branch ${newBranchIndex}. Total messages: ${newHistory.length}`);
      return newHistory;
    });

    // Save the current branch selection to database
    if (currentSessionId && user && documentExists) {
      console.log('💾 Saving branch selection to database');
      try {
        const response = await fetch(`/backend/api/chat-messages/${messageId}`, {
          method: "PATCH",
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: chatHistory.find(m => m.id === messageId)?.content || '',
            currentBranch: newBranchIndex,
          }),
        });

        if (!response.ok) {
          console.warn('⚠️ Failed to save branch selection to database');
        } else {
          console.log('✅ Branch selection saved to database');
        }
      } catch (err) {
        console.error('❌ Error saving branch selection:', err);
      }
    }

    toast.success(`Switched to conversation path ${newBranchIndex + 1}`);
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      // Remove the assistant message we're regenerating
      setChatHistory((prev) => prev.filter((msg) => msg.id !== messageId));

      // Delete from database if we have session
      if (currentSessionId && user && documentExists) {
        try {
          await fetch(`/backend/api/chat-messages/${messageId}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          });
        } catch (error) {
          console.warn("Failed to delete message from database:", error);
        }
      }

      toast.success("Message deleted successfully");
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      toast.error("Failed to delete message");
    } finally {
      setIsQuerying(false);
    }
  };

  const handleDocumentDeleted = () => {
    console.log("🗑️ Handling document deletion - resetting to upload state");

    setCurrentSessionId(null);
    setChatHistory([]);
    setCurrentDocument(null);
    setQuery("");
    setError("");
    setDocumentExists(false);
    setIsLoadingSession(false);
    setLoadingSessionId(null);

    toast.dismiss();

    onUploadSuccess({
      documentId: "",
      fileName: "",
      originalFileName: "",
      fileSize: 0,
      uploadedAt: "",
      pageCount: 0,
      mimeType: "",
      conversionPerformed: false,
    });
  };

  // ✅ NEW: Function to stop/abort the current query
  const handleStopQuery = () => {
    if (queryAbortController) {
      console.log("🛑 Stopping query...");
      queryAbortController.abort();
      setQueryAbortController(null);
      setIsQuerying(false);
      isSubmittingRef.current = false;
      setTypingMessageId(null);
    }
  };

  // Helper function to update branch subsequentMessages when new messages are added
  const updateBranchesWithNewMessages = async (history: ChatMessage[], newAssistantMessageId: string) => {
    // Find the most recent USER message with branches
    let lastBranchedUserMessage: ChatMessage | null = null;
    let lastBranchedUserMessageIndex = -1;
    
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].type === "USER" && history[i].branches && history[i].branches!.length > 0) {
        lastBranchedUserMessage = history[i];
        lastBranchedUserMessageIndex = i;
        break;
      }
    }
    
    if (!lastBranchedUserMessage || lastBranchedUserMessageIndex === -1) {
      // No branched messages, nothing to update
      return;
    }
    
    // Get all messages after the branched user message
    const messagesAfterBranch = history.slice(lastBranchedUserMessageIndex + 1);
    
    if (messagesAfterBranch.length === 0) {
      return;
    }
    
    // Update the current branch's subsequentMessages
    const updatedBranches = [...lastBranchedUserMessage.branches!];
    const currentBranchIndex = lastBranchedUserMessage.currentBranch ?? 0;
    
    if (updatedBranches[currentBranchIndex]) {
      updatedBranches[currentBranchIndex] = {
        ...updatedBranches[currentBranchIndex],
        subsequentMessages: messagesAfterBranch
      };
      
      console.log(`🌿 Updating branch ${currentBranchIndex} with ${messagesAfterBranch.length} subsequent messages`);
      
      // Save updated branches to database
      try {
        const response = await fetch(`/backend/api/chat-messages/${lastBranchedUserMessage.id}`, {
          method: "PATCH",
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: lastBranchedUserMessage.content,
            branches: updatedBranches,
            currentBranch: currentBranchIndex,
          }),
        });
        
        if (response.ok) {
          console.log('✅ Branch subsequentMessages updated in database');
          
          // Delete the subsequent messages from the database since they're now stored in the branch
          for (const msgToDelete of messagesAfterBranch) {
            try {
              const deleteResponse = await fetch(`/backend/api/chat-messages/${msgToDelete.id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
              });
              
              if (deleteResponse.ok) {
                console.log(`🗑️ Deleted message ${msgToDelete.id} from database (now in branch)`);
              } else {
                console.warn(`⚠️ Failed to delete message ${msgToDelete.id} from database`);
              }
            } catch (deleteErr) {
              console.error(`❌ Error deleting message ${msgToDelete.id}:`, deleteErr);
            }
          }
          
          // Update local state
          setChatHistory(prev => prev.map(msg => 
            msg.id === lastBranchedUserMessage!.id 
              ? { ...msg, branches: updatedBranches }
              : msg
          ));
        } else {
          console.warn('⚠️ Failed to update branch in database');
        }
      } catch (err) {
        console.error('❌ Error updating branch:', err);
      }
    }
  };

  const handleQuery = async (queryText?: string) => {
    console.log("🚀 handleQuery called!", {
      isSubmittingRef: isSubmittingRef.current,
      isQuerying,
      queryText,
      query,
      documentExists,
      currentDocument: !!currentDocument,
      currentDocumentId: currentDocument?.id,
      currentSessionId,
    });

    if (isSubmittingRef.current || isQuerying) {
      console.log("⏸️ Query blocked - already submitting or querying");
      return;
    }

    const currentQuery = queryText || query;

    // ✅ NEW: Check token limits before proceeding
    if (tokenLimitInfo.isLimitReached) {
      console.log("❌ Query blocked - token limit reached");
      const limitMessage = `Message limit reached. It will refresh by ${tokenLimitInfo.resetTime}`;
      setError(limitMessage);
      toast.error(limitMessage);
      return;
    }

    if (!documentExists) {
      console.log("❌ Query blocked - document does not exist");
      setError("Document no longer exists. Cannot process queries.");
      return;
    }

    // FIXED: Verify we have current document loaded in RAG system
    if (!currentDocument) {
      console.log("❌ Query blocked - no current document");
      setError("No document loaded. Please upload a document first.");
      return;
    }

    console.log("✅ All checks passed, proceeding with query");

    // FIXED: Double-check that backend has the right document
    try {
      console.log("🔍 Starting backend document verification...");
      const isDevelopment = process.env.NODE_ENV === "development";
      const RAG_BASE_URL = isDevelopment
        ? "http://localhost:8000"
        : process.env.NEXT_PUBLIC_RAG_API_URL;

      // Ensure we pass the same X-Session-Id used by uploads/queries
      let sessionId =
        typeof window !== "undefined"
          ? localStorage.getItem("rag_session_id") || ""
          : "";
      if (!sessionId && typeof window !== "undefined") {
        sessionId = `sess_${Math.random().toString(36).slice(2)}_${Date.now()}`;
        localStorage.setItem("rag_session_id", sessionId);
      }

      const statusResponse = await fetch(`${RAG_BASE_URL}/current-document`, {
        headers: {
          ...getAuthHeaders(),
          "X-Session-Id": sessionId || "default",
        },
      });

      if (statusResponse.ok) {
        const currentDoc = await statusResponse.json();
        console.log("🔍 Backend verification response:", currentDoc);
        if (!currentDoc.has_document) {
          console.log("❌ Query blocked - no document in AI system");
          setError(
            "No document loaded in AI system. Please refresh and re-upload."
          );
          return;
        }

        // Log for debugging
        console.log("🔍 Backend current document:", currentDoc.document_id);
        console.log("🔍 Frontend current document:", currentDocument.id);
      }
      console.log("✅ Backend document verification completed");
    } catch (error) {
      console.warn("Could not verify backend document status:", error);
      // Continue with query - don't fail for verification issues
    }

    console.log("🔒 Locking UI and starting query...");
    // Immediately lock UI and clear input to prevent double-submit
    isSubmittingRef.current = true;
    setIsQuerying(true);
    setError("");
    setQuery("");

    // ✅ NEW: Create AbortController for this query
    const abortController = new AbortController();
    setQueryAbortController(abortController);

    let sessionId = currentSessionId;
    console.log("🔍 Session check:", {
      currentSessionId,
      hasUser: !!user,
      hasCurrentDocument: !!currentDocument,
    });

    if (!sessionId && user && currentDocument) {
      if (isCreatingSession) {
        console.log("❌ Query blocked - already creating session");
        toast.info("Creating session, please wait...");
        return;
      }

      console.log("🆕 No session found, creating new session before query...");
      sessionId = await createNewSession();

      if (!sessionId) {
        console.log("❌ Query blocked - failed to create session");
        setError("Failed to create chat session");
        setIsQuerying(false);
        isSubmittingRef.current = false;
        return;
      }

      console.log("✅ Session created successfully:", sessionId);
    }

    console.log("📝 Adding user message...");

    await addMessage(
      {
        type: "USER",
        content: currentQuery,
        query: currentQuery,
      },
      sessionId || undefined
    );

    try {
      // Use streaming API for real-time responses
      console.log("📡 Starting streaming query...");

      // Create a temporary assistant message that will be updated as we stream
      const assistantMessageId = crypto.randomUUID();
      let streamedContent = "";
      let sourceCount = 0;

      // Add a temporary streaming message with pulse animation
      const tempMessage: ChatMessage = {
        id: assistantMessageId,
        type: "ASSISTANT",
        content: "Thinking...",
        createdAt: new Date(),
        query: currentQuery,
        isThinking: true, // Flag to trigger pulse animation
        isStreaming: true, // Mark as actively streaming
      };

      setChatHistory(prev => [...prev, tempMessage]);
      // DO NOT set typing message ID - we only want the streaming content

      // Create RAG API client instance
      const ragClient = new (await import('../../utils/api-client')).RAGApiClient();

      // Prevent tab throttling during streaming
      let wakeLock: any = null;
      if ('wakeLock' in navigator) {
        try {
          wakeLock = await navigator.wakeLock.request('screen');
          console.log('🔒 Screen wake lock acquired for streaming');
        } catch (err) {
          console.log('⚠️ Could not acquire wake lock:', err);
        }
      }

      // Also use Page Visibility API to ensure continuous processing
      const originalTitle = document.title;

      try {
        // Stream the response
        await ragClient.streamQueryDocument(
        currentQuery,
        (chunk) => {
          // Handle different chunk types
          if (chunk.type === 'content_chunk') {
            // Update streamedContent even if partial_response is empty (for first chunk)
            if (chunk.partial_response !== undefined) {
              streamedContent = chunk.partial_response;
              // Update the streaming message with the partial response
              // Only remove thinking state when we have actual content
              setChatHistory(prev =>
                prev.map(msg =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        content: streamedContent || "Generating response...",
                        isThinking: !streamedContent, // Keep thinking animation if no content yet
                        isStreaming: true
                      }
                    : msg
                )
              );
            }
          } else if (chunk.type === 'end' || chunk.type === 'complete') {
            // Mark streaming as complete and update final content
            const finalContent = chunk.response || streamedContent || "No response generated";

            setChatHistory(prev =>
              prev.map(msg =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      content: finalContent,
                      sourceCount: chunk.source_count || sourceCount,
                      isStreaming: false,
                      isThinking: false
                    }
                  : msg
              )
            );
          } else if (chunk.type === 'sources') {
            sourceCount = chunk.source_count || 0;
            console.log(`📚 FRONTEND: Sources received - ${sourceCount} sources`);
          } else if (chunk.type === 'start' || chunk.type === 'retrieval' || chunk.type === 'llm_start' || chunk.type === 'streaming_start') {
            // Keep thinking animation during these stages
            console.log(`💬 FRONTEND: ${chunk.type} event received`);
          }
        },
        (error) => {
          console.error('Streaming error:', error);

          // Check if this is an abort error (user clicked stop)
          if (error.name === 'AbortError') {
            console.log('🛑 User stopped the response generation');
            // Remove the incomplete assistant message
            setChatHistory(prev => prev.filter(msg => msg.id !== assistantMessageId));
            toast.info('Response generation stopped');
            return;
          }

          // Update message with error and remove streaming state
          setChatHistory(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: `❌ Sorry, I encountered an error: ${error.message}`, isStreaming: false, isThinking: false }
                : msg
            )
          );
        },
        () => {
          console.log('🏁 FRONTEND: Streaming completed callback called');
          console.log(`Final streamedContent: "${streamedContent}" (${streamedContent.length} chars)`);

          // Ensure streaming state is cleared and content is saved
          setChatHistory(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: streamedContent || msg.content || "No response generated",
                    isStreaming: false,
                    isThinking: false
                  }
                : msg
            )
          );
        },
        undefined, // documentId
        abortController.signal, // Pass abort signal to enable stopping
        isVoiceChat // Pass voice mode flag to adjust response style
      );

      } finally {
        // Cleanup: Release wake lock and remove event listener
        if (wakeLock) {
          wakeLock.release();
          console.log('🔓 Screen wake lock released');
        }
        document.title = originalTitle;
      }

      // Save to database WITHOUT adding another message to chat history
      if (sessionId && user && documentExists && streamedContent) {
        try {
          // Save to database in background (don't block UI)
          setTimeout(async () => {
            try {
              // Use direct API call instead of addMessage to avoid creating duplicate
              const response = await fetch(`/backend/api/chat-messages`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${authUtils.getToken()}`,
                },
                body: JSON.stringify({
                  id: assistantMessageId, // IMPORTANT: Use the same ID as the frontend message
                  sessionId: sessionId,
                  role: "assistant",
                  content: streamedContent,
                  tokens_used: sourceCount,
                }),
              });

              if (response.ok) {
                console.log("💾 Streamed message saved to database");
                
                // Check if we need to update branch's subsequentMessages
                // Get the latest chat history state
                setChatHistory(currentHistory => {
                  updateBranchesWithNewMessages(currentHistory, assistantMessageId);
                  return currentHistory; // Don't modify here, updateBranchesWithNewMessages will handle it
                });
              } else {
                console.warn("Failed to save streamed message to database");
              }
            } catch (saveError) {
              console.warn("Failed to save streamed message to database:", saveError);
            }
          }, 0);
        } catch (saveError) {
          console.warn("Failed to save streamed message to database:", saveError);
        }
      }
    } catch (error) {
      // Handle streaming errors

      // Check if the error is due to abort
      if (
        error instanceof Error &&
        (error.name === "AbortError" || error.message?.includes("aborted"))
      ) {
        console.log("🛑 Query was aborted by user");
        return; // Don't show error toast for user-initiated cancellation
      }

      console.error("Query error:", error);

      if (isSecurityError(error)) {
        const securityErrorMessage = getSecurityErrorMessage(error);
        setError(securityErrorMessage);

        let assistantResponse = "";

        switch (error.type) {
          case "rate_limit":
            assistantResponse =
              "⏱️ I'm temporarily unavailable due to rate limiting. Please wait a moment before asking your next question.";
            toast.error("Query rate limit exceeded");
            break;

          case "injection":
            assistantResponse =
              "🛡️ I detected potentially harmful content in your query. Please rephrase your question using normal, conversational language and I'll be happy to help.";
            toast.warning("Query was blocked for security reasons");
            break;

          default:
            assistantResponse = `🔒 Security Error: ${securityErrorMessage}`;
            toast.error("Security error occurred");
        }

        await addMessage(
          {
            type: "ASSISTANT",
            content: assistantResponse,
            query: currentQuery,
          },
          sessionId || undefined
        );
      } else {
        const errorMessage = handleApiError(error);
        setError(errorMessage);

        if (errorMessage.includes("canceled")) {
          await addMessage(
            {
              type: "ASSISTANT",
              content: `Response generation was canceled`,
              query: currentQuery,
            },
            sessionId || undefined
          );
        } else {
          await addMessage(
            {
              type: "ASSISTANT",
              content: `❌ Sorry, I encountered an error: ${errorMessage}`,
              query: currentQuery,
            },
            sessionId || undefined
          );

          toast.error("Query failed: " + errorMessage);
        }
      }
    } finally {
      setIsQuerying(false);
      isSubmittingRef.current = false;
      setQueryAbortController(null);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!isQuerying && !isSubmittingRef.current) {
        handleQuery();
      }
    }
    if (event.key === "Escape") {
      handleStopQuery();
    }
  };

  const handleManualInput = () => {
    setIsVoiceChat(false);
    loadOrCreateSession();
  };

  // Modified save file handler
  const handleSaveFileClick = () => {
    // Check if user has cloud storage access
    if (!hasCloudStorageAccess()) {
      // Show paywall modal
      setConfirmationModalConfig({
        header: "Save to Cloud Storage",
        message:
          "Save your documents securely to the cloud and access them from any device.",
        trueButton: "Upgrade Now",
        falseButton: "Cancel",
        type: ModalType.PAYWALL,
        onConfirm: () => {
          // This won't be called for paywall - upgrade button handles it
        },
        // Add paywall configuration
        paywall: {
          isPaywallFeature: true,
          userProfile: user,
          featureType: "cloudStorage",
          onUpgrade: () => {
            // Redirect to pricing page
            window.location.href = "/frontend/pricing";
          },
          allowTemporary: true, // Allow users to save temporarily
        },
      });
      return;
    }

    // If user has access, show regular save confirmation
    setConfirmationModalConfig({
      header: "Save Session?",
      message:
        "Save your document securely to the cloud and access them from any device.",
      trueButton: "Save",
      falseButton: "Cancel",
      type: ModalType.SAVE,
      onConfirm: handleSaveFile,
    });
  };

  const handleSaveFile = async () => {
    if (!currentDocument || !isAuthenticated || !user || !documentExists) {
      toast.error(
        "No document to save, user not authenticated, or document no longer exists"
      );
      return;
    }

    const documentStatus = currentDocument.status;

    console.log("📄 Document status check:", {
      originalStatus: currentDocument.status,
      documentId: currentDocument.id,
      documentStatus: documentStatus,
      exists: documentExists,
    });

    if (documentStatus === "INDEXED") {
      toast.info("Document is already saved to your account");
      return;
    }

    const savableStatuses = ["TEMPORARY", "READY", "UPLOADED"];

    if (!savableStatuses.includes(documentStatus)) {
      toast.error(
        `Cannot save document with status: ${currentDocument.status}. Only temporary documents can be saved.`
      );
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

      const response = await fetch("/backend/api/documents/save-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authUtils.getToken()}`,
        },
        body: JSON.stringify({
          documentId: currentDocument.id,
          document_id: currentDocument.id,
          title:
            currentDocument.originalFileName ||
            currentDocument.fileName ||
            "Untitled",
        }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          setDocumentExists(false);
          handleDocumentDeleted();
          return;
        }

        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save document");
      }

      const savedDocumentInfo = await response.json();

      console.log("✅ Document saved successfully:", savedDocumentInfo);

      setCurrentDocument({
        ...currentDocument,
        status: "INDEXED",
        s3Key: savedDocumentInfo.s3Key,
        s3Url: savedDocumentInfo.s3Url,
      });

      setIsSaveModalOpen(false);
      toast.success("Document saved to your account and cloud storage!");
    } catch (error: any) {
      console.error("Failed to save file:", error);

      if (
        error.message.includes("Temporary file not found") ||
        error.message.includes("no longer available") ||
        error.message.includes("not found")
      ) {
        toast.error(
          "Document file expired or was deleted. Please re-upload the document."
        );
        setDocumentExists(false);
        if (handleNewChat) {
          handleNewChat();
        }
      } else {
        toast.error(error.message || "Failed to save file to account");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const truncateString = (str: string, maxLength: number) => {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength) + "...";
  };

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

  // ✅ NEW: Show SessionLoader when loading RAG system
  if (isLoadingRagSystem) {
    const ragStage =
      ragLoadingInfo.operation === "reactivating"
        ? "loading_rag"
        : "loading_rag";
    const operationText =
      ragLoadingInfo.operation === "reactivating" ? "Reactivating" : "Loading";

    return (
      <SessionLoader
        sessionTitle={`${operationText} Document`}
        documentName={ragLoadingInfo.documentName || "Document"}
        stage={ragStage}
      />
    );
  }

  const handleDiscardAllAndStartNew = async () => {
    try {
      console.log("🗑️ Starting discard all process...");

      // 1. Delete the session if it exists
      if (currentSessionId) {
        console.log("🗑️ Deleting session:", currentSessionId);
        await handleDeleteSession(currentSessionId);
      }

      // 2. Delete the document if it exists and is temporary
      if (currentDocument && currentDocument.status === "TEMPORARY") {
        console.log("🗑️ Deleting temporary document:", currentDocument.id);
        try {
          const response = await fetch(
            `/backend/api/documents/${currentDocument.id}`,
            {
              method: "DELETE",
              headers: getAuthHeaders(),
            }
          );

          if (response.ok) {
            console.log("✅ Document deleted successfully");
            toast.success("Document and session deleted");
          } else if (response.status === 404) {
            console.log("⚠️ Document already deleted or not found");
          } else {
            console.warn("⚠️ Failed to delete document, but continuing...");
          }
        } catch (error) {
          console.warn("⚠️ Error deleting document:", error);
          // Continue with cleanup even if document deletion fails
        }
      }

      // 3. Clear all local state and storage
      console.log("🧹 Clearing all state...");
      clearAllSessionState();

      // 4. Clear localStorage for current user
      if (user?.id) {
        const storageKey = `uploaded_documents_${user.id}`;
        localStorage.removeItem(storageKey);
      } else {
        localStorage.removeItem("uploaded_documents");
      }

      // 5. Clear RAG cache
      ragCache.clearAll();

      // 6. Start new chat flow
      if (handleNewChat) {
        console.log("🆕 Starting new chat...");
        handleNewChat();
      }

      console.log("✅ Discard all process completed");
    } catch (error) {
      console.error("❌ Error during discard all process:", error);
      toast.error(
        "Error occurred while discarding. Some cleanup may be incomplete."
      );

      // Still try to clear state even if there were errors
      clearAllSessionState();
      if (handleNewChat) {
        handleNewChat();
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Fixed Document Header */}
      <div className="flex-shrink-0 p-4">
        {currentDocument ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!documentExists && (
                <AlertCircle className="w-6 h-6 text-red-500" />
              )}
              {/* <FileText className={`w-8 h-8 ${documentExists ? 'text-blue-600' : 'text-gray-400'}`} /> */}
              {/* <BiSolidFilePdf className="w-8 h-8 text-red-500 flex-shrink-0" /> */}
              <HiOutlinePaperClip className="w-6 h-6 text-red-500 flex-shrink-0" />

              <div>
                <div className="flex items-center">
                  <h3
                    className={`text-sm md:text-base font-semibold ${
                      documentExists
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    <span className="block md:hidden">
                      {truncateString(currentDocument.fileName, 20)}
                    </span>
                    <span className="text-lg hidden md:block">
                      {currentDocument.fileName}
                    </span>
                    {!documentExists && " (Document Deleted)"}
                  </h3>

                  <button
                    onClick={() => setIsPDFViewerOpen(true)}
                    disabled={!documentExists}
                    title="View PDF"
                    className={`flex items-center px-2 text-sm rounded-lg transition-all duration-300 ${
                      !documentExists
                        ? " text-muted-foreground cursor-default"
                        : "text-foreground hover:brightness-90 cursor-pointer"
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden md:block"></span>
                  </button>
                </div>

                <p
                  className={`text-sm ${
                    documentExists ? "text-muted-foreground" : "text-red-600"
                  }`}
                >
                  {!documentExists && (
                    "Document no longer available. Please upload a new document."
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSaveFileClick}
                disabled={
                  !documentExists || currentDocument?.status === "INDEXED"
                }
                className={`flex items-center p-3 px-3 text-sm rounded-md transition-all duration-300 ${
                  !documentExists || currentDocument?.status === "INDEXED"
                    ? "bg-tertiary text-muted-foreground cursor-default"
                    : "text-foreground bg-accent hover:bg-accent/0  cursor-pointer"
                }`}
              >
                {!documentExists ? (
                  "Unavailable"
                ) : currentDocument?.status === "INDEXED" ? (
                  <>
                    <CloudCheck className="w-4 h-4" />{" "}
                    <span className="hidden md:block">Saved</span>
                  </>
                ) : (
                  <>
                    <CloudDownload className="w-4 h-4" />{" "}
                    <span className="hidden md:block">Save File</span>
                  </>
                )}
              </Button>

              <Button
                onClick={
                  currentDocument.status === "TEMPORARY"
                    ? () =>
                        openConfirmationModal(
                          {
                            header: "Unsaved File and Session",
                            message:
                              "You have unsaved changes. Are you sure you want to discard the file and start a new chat?",
                            trueButton: "Discard All",
                            falseButton: "Cancel",
                            type: ModalType.WARNING,
                          },
                          async () => {
                            await handleDiscardAllAndStartNew();
                          }
                        )
                    : () => {
                        if (handleNewChat) {
                          handleNewChat();
                        }
                      }
                }
                className="flex items-center cursor-pointer p-3 px-3 gap-1 text-sm hover:brightness-110 transition-all duration-300 text-white rounded-md"
              >
                <DiamondPlus className="w-5 h-5" strokeWidth={1.5} />
                <span className="hidden md:block">New Chat</span>
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {isVoiceChat && (
        <VoiceChatComponent
          isSystemReady={isSystemReady}
          selectedSessionId={currentSessionId || undefined} // Changed from selectedSessionId prop
          user={user} // ADDED - was missing
          currentDocument={currentDocument} // ADDED - was missing
          getAuthHeaders={getAuthHeaders}
          checkDocumentExists={checkDocumentExists}
          handleDocumentDeleted={handleDocumentDeleted}
          onSessionCreated={(sessionId) => {
            setCurrentSessionId(sessionId);
            if (handleNewChat) handleNewChat();
          }}
          handleManualInput={() => handleManualInput()} // Changed to close voice chat
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
          typingMessageId={typingMessageId}
          onTypingComplete={() => setTypingMessageId(null)}
          onBranchChange={handleBranchChange}
        />

        {/* Input Area */}
        <div className="flex-shrink-0 bg-panel p-6">
          {documentExists && (
            <>
              {/* ✅ NEW: Token limit warning message */}
              {tokenLimitInfo.isLimitReached && (
                <div className="mb-4 p-3 bg-yellow/10 border border-yellow rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-700">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      Message limit reached. It will refresh by{" "}
                      {tokenLimitInfo.resetTime}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-row mx-auto w-full border border-tertiary rounded-lg">
                <div className="flex-1">
                  <textarea
                    value={query}
                    onKeyDown={handleKeyPress}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={
                      isCreatingSession
                        ? "Creating session, please wait..."
                        : tokenLimitInfo.isLimitReached
                        ? "Message limit reached. Please wait for reset or upgrade your plan."
                        : "Ask a question..."
                    }
                    rows={2}
                    disabled={tokenLimitInfo.isLimitReached || isCreatingSession || !currentSessionId}
                    className={`w-full px-3 py-2 h-24 rounded-xl focus:outline-none resize-none ${
                      tokenLimitInfo.isLimitReached || isCreatingSession || !currentSessionId
                        ? "text-gray-500 cursor-not-allowed"
                        : ""
                    }`}
                  />
                </div>
                <div className="flex justify-end items-center gap-4 pl-0 px-4 ">
                  <span className="flex items-center gap-2 mt-10">
                    <button
                      onClick={handleVoiceModeClick}
                      title="Voice Chat with Lynx AI"
                      disabled={tokenLimitInfo.isLimitReached}
                      className={`flex items-center right-18 top-1/2 -translate-y-1/2 cursor-pointer p-2 rounded-full bg-gradient-to-tl from-yellow to-yellow-600 text-white hover:bg-blue-700 h-fit transition-all duration-300 ${
                        tokenLimitInfo.isLimitReached
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      <AudioLines className="w-6 h-6" />
                    </button>
                    {isQuerying ? (
                      <button
                        onClick={handleStopQuery}
                        className="flex items-center group top-1/2 -translate-y-1/2 cursor-pointer p-2 rounded-full bg-foreground text-white hover:bg-red-600 h-fit transition-all duration-300 ease-in-out"
                        title="Stop generation"
                      >
                        <GoSquareFill className="w-6 h-6" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleQuery()}
                        disabled={
                          !query.trim() ||
                          !documentExists ||
                          tokenLimitInfo.isLimitReached ||
                          isQuerying ||
                          isSubmittingRef.current ||
                          isCreatingSession ||
                          !currentSessionId
                        }
                        className="flex items-center group top-1/2 -translate-y-1/2 cursor-pointer p-2 rounded-full bg-foreground text-primary hover:bg-muted-foreground disabled:bg-muted disabled:text-muted-foreground disabled:cursor-default h-fit transition-all duration-300 ease-in-out"
                      >
                        <ArrowUp className="w-6 h-6" />
                      </button>
                    )}
                  </span>
                </div>
              </div>
            </>
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

        {/* PDF Viewer Modal */}
        <PDFViewer
          isOpen={isPDFViewerOpen}
          document={
            currentDocument
              ? {
                  id: currentDocument.id,
                  fileName: currentDocument.fileName,
                  originalFileName:
                    currentDocument.originalFileName ||
                    currentDocument.fileName,
                  size: currentDocument.fileSize || 0,
                  uploadedAt:
                    currentDocument.uploadedAt || new Date().toISOString(),
                  pages: currentDocument.pageCount,
                  status: currentDocument.status,
                  mimeType: currentDocument.mimeType || "application/pdf",
                }
              : null
          }
          onClose={() => setIsPDFViewerOpen(false)}
        />
      </div>

      {/* PDF Viewer Modal */}
      <PDFViewer
        isOpen={pdfViewer.isOpen}
        document={pdfViewer.document}
        onClose={() => setPdfViewer({ isOpen: false, document: null })}
        onOpenInChat={(documentId) => {
          // The document is already loaded in the chat, so just close the PDF viewer
          setPdfViewer({ isOpen: false, document: null });
        }}
      />

      <Toaster />
    </div>
  );
}
