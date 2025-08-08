// FIXED: Updated Home page with proper document switching and session management
"use client";

import React, { useState, useEffect, useRef } from "react";
import ChatViewer from "./tabs/chat-viewer/ChatViewer";
import FileManager from "./tabs/file-manager/FileManager";
import ChatHistory from "./tabs/chat-viewer/ChatHistory";
import {
  apiService,
  handleApiError,
  profileService,
  SystemStatus,
  UploadResponse,
} from "../lib/api";
import {
  GoArchive,
  GoComment,
  GoFile,
  GoFileDirectory,
  GoHistory,
} from "react-icons/go";
import NavBar from "../components/NavBar";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "@/lib/context/AuthContext";
import { LogOut, Plus, Menu, X, Mic, Lock } from "lucide-react";
import UploadPage from "./tabs/chat-viewer/UploadPage";
import ConfirmationModal, { ModalType } from "../components/ConfirmationModal";
import { useTheme } from "next-themes";

type ActiveTab =
  | "chat"
  | "documents"
  | "chat_history"
  | "upload"
  | "voice_chat";

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("upload");
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // FIXED: Add state to track uploads and session management
  const [isProcessingNewUpload, setIsProcessingNewUpload] = useState(false);
  const [lastProcessedDocumentId, setLastProcessedDocumentId] = useState<string | null>(null);
  const [uploadCompleted, setUploadCompleted] = useState(false);
  
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [subscriptionStatus, setSubscriptionStatus] = useState("");
  
  // FIXED: Add ref to ChatViewer for direct state clearing
  const chatViewerRef = useRef<any>(null);

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
      featureType?: "saveSessions" | "cloudStorage" | "voiceMode" | "fileHistory" | "pdfDownload";
      onUpgrade?: () => void;
      allowTemporary?: boolean;
    };
  } | null>(null);

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
      const profile = await profileService.getProfile();
      setSubscriptionStatus(
        profile.subscription?.plan_type?.toUpperCase() || ""
      );
    };
    getSubscriptionStatus();
  }, []);

  // Clear uploaded files and reset system on page load
  useEffect(() => {
    const clearUploadedFiles = async () => {
      try {
        await loadSystemStatus();
        console.log("✅ Page loaded, checking system status");
      } catch (error) {
        console.error("Failed to load system status:", error);
      }
    };

    clearUploadedFiles();
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadSystemStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const status = await apiService.getStatus();
      setSystemStatus(status);
    } catch (error) {
      console.error("Failed to load system status:", error);
      setSystemStatus(null);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleDocumentDeleted = async (deletedDocId: string) => {
    if (deletedDocId === currentDocumentId) {
      setCurrentDocumentId(null);
      setCurrentSessionId(null);
      setActiveTab("upload");

      try {
        await apiService.resetSystem();
        await loadSystemStatus();
      } catch (error) {
        console.error("Failed to reset system after document deletion:", error);
      }
    }
  };

  const handleDocumentSelect = async (docId: string) => {
    console.log('🔄 Document selected:', docId);
    
    // FIXED: Clear previous document state when selecting different document
    if (docId !== currentDocumentId) {
      console.log('📄 Switching documents - clearing previous state');
      setCurrentSessionId(null);
      clearChatViewerState();
    }
    
    setCurrentDocumentId(docId);

    const savedDocs = localStorage.getItem("uploaded_documents");
    if (savedDocs) {
      const docs = JSON.parse(savedDocs);
      const selectedDoc = docs.find((doc: any) => doc.id === docId);

      if (selectedDoc) {
        setActiveTab("chat");
        setIsMobileSidebarOpen(false);
      }
    }
  };

  // FIXED: Enhanced upload success handler with proper document switching
  const handleUploadSuccess = (response: UploadResponse) => {
    console.log("🎉 MAIN COMPONENT - Upload success:", response);
    console.log("📄 New document ID:", response.documentId);

    // FIXED: Set processing state
    setIsProcessingNewUpload(true);
    
    // FIXED: Clear any existing document state immediately
    if (currentDocumentId && currentDocumentId !== response.documentId) {
      console.log('🧹 Clearing previous document state for new upload');
      clearChatViewerState();
    }

    // Store in localStorage with correct field names for ChatViewer
    const storageKey = user?.id
      ? `uploaded_documents_${user.id}`
      : "uploaded_documents";

    const existingDocs = JSON.parse(localStorage.getItem(storageKey) || "[]");

    // FIXED: Remove any existing document with same name or ID to prevent duplicates
    const filteredDocs = existingDocs.filter(
      (doc: any) => 
        doc.id !== response.documentId && 
        doc.fileName !== response.fileName &&
        doc.originalFileName !== response.originalFileName
    );

    // FIXED: Add the new document with correct field mapping and upload sequence
    const documentForStorage = {
      id: response.documentId,
      documentId: response.documentId, // Ensure both fields exist
      fileName: response.fileName,
      originalFileName: response.originalFileName,
      original_file_name: response.originalFileName,
      fileSize: response.fileSize,
      file_size: response.fileSize,
      pageCount: response.pageCount || 1,
      page_count: response.pageCount || 1,
      status: response.status || "TEMPORARY",
      uploadedAt: response.uploadedAt,
      uploaded_at: response.uploadedAt,
      databaseId: response.documentId,
      mimeType: response.mimeType,
      securityStatus: response.securityStatus,
      conversionPerformed: response.conversionPerformed,
      
      // FIXED: Add upload tracking
      uploadSequence: Date.now(),
      isLatestUpload: true
    };

    // FIXED: Mark all other documents as not latest
    const updatedDocs = filteredDocs.map((doc: any) => ({
      ...doc,
      isLatestUpload: false
    }));

    // Add new document at the beginning
    updatedDocs.unshift(documentForStorage);
    
    // Keep only last 10 documents to prevent localStorage bloat
    const recentDocs = updatedDocs.slice(0, 10);
    localStorage.setItem(storageKey, JSON.stringify(recentDocs));

    console.log("📄 Document stored in localStorage:", documentForStorage);

    // FIXED: Set current document ID and tracking
    setCurrentDocumentId(response.documentId || "");
    setLastProcessedDocumentId(response.documentId || "");
    setCurrentSessionId(null); // Clear any previous session
    setActiveTab("chat");
    setIsMobileSidebarOpen(false);
    setUploadCompleted(true);

    console.log("🔄 Switched to chat tab with document ID:", response.documentId);
    
    // FIXED: Reset processing state after a short delay
    setTimeout(() => {
      setIsProcessingNewUpload(false);
      setUploadCompleted(false);
    }, 1000);
  };

  // FIXED: Enhanced new chat handler with proper state clearing
  const handleNewChat = () => {
    console.log('🆕 Starting new chat - clearing all state');
    
    // Clear all document-related state
    setCurrentDocumentId(null);
    setCurrentSessionId(null);
    setLastProcessedDocumentId(null);
    setIsProcessingNewUpload(false);
    setUploadCompleted(false);
    
    // Clear ChatViewer state
    clearChatViewerState();
    
    // Clear localStorage to prevent confusion
    const storageKey = user?.id ? `uploaded_documents_${user.id}` : 'uploaded_documents';
    localStorage.removeItem(storageKey);
    
    // Switch to upload tab
    setActiveTab("upload");
    setIsMobileSidebarOpen(false);
    
    console.log('✅ New chat state cleared');
  };

  // If using the callback approach, update your Home component like this:
  const [clearChatViewerFn, setClearChatViewerFn] = useState<(() => void) | null>(null);
  const [pendingClearChatViewer, setPendingClearChatViewer] = useState(false);

  // In handleClearPreviousSession:
  const clearChatViewerState = () => {
    // Defer clearing ChatViewer until after this render commit
    // to avoid setState during parent render warnings.
    console.log('🧹 Scheduling ChatViewer state clear');
    setPendingClearChatViewer(true);
  };

  // Perform the actual clear after render commit
  useEffect(() => {
    if (pendingClearChatViewer && clearChatViewerFn) {
      console.log('🧹 Executing deferred ChatViewer state clear');
      clearChatViewerFn();
      setPendingClearChatViewer(false);
    }
  }, [pendingClearChatViewer, clearChatViewerFn]);

  // FIXED: Add callback for upload component to clear previous session
  const handleClearPreviousSession = () => {
    console.log('🧹 Clearing previous session before new upload');
    setCurrentDocumentId(null);
    setCurrentSessionId(null);
    clearChatViewerState();
  };

  const handleVoiceChat = () => {
    setActiveTab("voice_chat");
    setIsMobileSidebarOpen(false);
  };

  const handleTabClick = (tab: ActiveTab) => {
    if (subscriptionStatus === "BASIC" && tab === "documents") {
      setConfirmationModalConfig({
        header: "Access Full Features",
        message: "Upgrade to Premium to access all features.",
        trueButton: "Upgrade Now",
        falseButton: "Cancel",
        type: ModalType.PAYWALL,
        onConfirm: () => {},
        paywall: {
          isPaywallFeature: true,
          userProfile: user,
          featureType: "fileHistory",
          onUpgrade: () => {
            window.location.href = "/frontend/pricing";
          },
          allowTemporary: true,
        },
      });
      return;
    }
    setActiveTab(tab);
    setIsMobileSidebarOpen(false);
  };

  const handleSessionSelect = async (sessionId: string) => {
    console.log('📝 Session selected:', sessionId);
    setCurrentSessionId(sessionId);
    setActiveTab("chat");
    setIsMobileSidebarOpen(false);
  };

  const handleSignOut = () => {
    openConfirmationModal(
      {
        header: "Sign out",
        message: "Are you sure you want to sign out?",
        trueButton: "Sign out",
        falseButton: "Cancel",
        type: ModalType.DANGER,
      },
      () => {
        logout();
      }
    );
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const menuItems = [
    { id: "chat_history", label: "Chat History", icon: GoArchive },
    { id: "documents", label: "My Documents", icon: GoFileDirectory },
  ];

  const isSystemReady = systemStatus?.pdfLoaded && systemStatus?.indexReady;

  return (
    <ProtectedRoute>
      <div className="h-screen bg-primary flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-primary shadow-sm border-b flex-shrink-0 flex px-6 md:px-0">
          <div className="flex items-center justify-between">
            <button
              onClick={toggleMobileSidebar}
              className="lg:hidden bg-primary rounded-lg p-2 border"
            >
              {isMobileSidebarOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>
          <div className="flex-1 items-center justify-between">
            <NavBar />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex bg-primary flex-1 overflow-hidden relative">
          {/* Mobile Overlay */}
          {isMobileSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/20 z-40 md:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside
            className={`
            fixed md:relative inset-y-0 left-0 z-50 md:z-0
            w-64 md:w-1/5 bg-primary p-4 md:p-6 
            flex flex-col border-r flex-shrink-0
            transform transition-transform duration-300 ease-in-out
            ${
              isMobileSidebarOpen
                ? "translate-x-0"
                : "-translate-x-full md:translate-x-0"
            }
          `}
          >
            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden self-end mb-4 p-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Navigation Buttons */}
            <div className="space-y-2 mb-8">
              <button
                onClick={() => handleTabClick("chat_history")}
                className={`w-full relative cursor-pointer flex items-center gap-3 text-left p-3 rounded-lg transition-colors ${
                  activeTab === "chat_history"
                    ? "bg-blue/20 text-blue-700 font-semibold rounded-r-lg"
                    : " text-foreground hover:bg-accent"
                }`}
              >
                {activeTab === "chat_history" && (
                  <div className="h-full w-1 bg-blue-700 absolute left-0 overflow-hidden rounded-full"></div>
                )}
                <GoArchive
                  className={`${
                    activeTab === "chat_history" ? "ml-2" : "ml-0"
                  } transition-all duration-300 w-5 h-5 flex-shrink-0`}
                />
                <span className="truncate">Chat History</span>
              </button>

              <button
                onClick={() => handleTabClick("documents")}
                className={`w-full relative cursor-pointer flex  items-center gap-3 text-left p-3 rounded-lg transition-colors ${
                  activeTab === "documents"
                    ? "bg-blue/20 text-blue-700 font-semibold rounded-r-lg"
                    : "text-foreground hover:bg-accent"
                }`}
              >
                {activeTab === "documents" && (
                  <div className="h-full w-1 bg-blue-700  absolute left-0 overflow-hidden rounded-full"></div>
                )}
                <GoFileDirectory
                  className={`${
                    activeTab === "documents" ? "ml-2" : "ml-0"
                  } transition-all duration-300 w-5 h-5 flex-shrink-0`}
                />
                <span className="truncate flex items-center justify-between w-full">
                  My Documents
                  {subscriptionStatus === "BASIC" && (
                    <div className="bg-gradient-to-tr from-blue-500 to-blue-400 text-white rounded-full p-2 text-xs">
                      <Lock className="w-4 h-4 flex-shrink-0 text-white" />
                    </div>
                  )}
                </span>
              </button>
            </div>

            <div className="mt-auto space-y-3">
              <button
                onClick={handleSignOut}
                className={`w-full flex items-center justify-center gap-2 text-sm p-3 rounded-lg ${
                  theme === "dark"
                    ? "text-red-600 hover:bg-red-100 border border-red-500"
                    : "text-red-600 hover:bg-red-100 border border-red-200"
                } transition-colors cursor-pointer`}
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Sign out</span>
              </button>
            </div>
            <div className="flex items-center text-xs gap-1 mt-4 border-t border-tertiary pt-2 text-muted-foreground">
              <a href="/frontend/privacy-policy" target="_blank" rel="noopener noreferrer">
                Privacy Policy •
              </a>
              <p className="text-xs text-muted-foreground">v 0.1.9 pre-release</p>
            </div>
          </aside>

          {/* Main Content Area */}
          <section className="flex-1 flex flex-col overflow-hidden">
            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === "upload" && (
                <UploadPage 
                  onUploadSuccess={handleUploadSuccess}
                  handleNewChat={handleNewChat}
                  onClearPreviousSession={handleClearPreviousSession}
                />
              )}

              {activeTab === "chat" && (
                <ChatViewer
                  isSystemReady={!!isSystemReady}
                  onUploadSuccess={handleUploadSuccess}
                  selectedSessionId={currentSessionId || ""}
                  handleNewChat={handleNewChat}
                  handleVoiceChat={handleVoiceChat}
                  currentDocumentId={currentDocumentId}
                  onSessionDelete={(sessionId: string) => {
                    if (sessionId === currentSessionId) {
                      setCurrentSessionId(null);
                    }
                  }}
                  onClearStateCallback={setClearChatViewerFn}
                />
              )}

              {activeTab === "documents" && (
                <FileManager
                  onDocumentSelect={handleDocumentSelect}
                  onDocumentDeleted={handleDocumentDeleted}
                  currentDocumentId={currentDocumentId || ""}
                />
              )}

              {activeTab === "chat_history" && (
                <ChatHistory
                  onDocumentSelect={handleDocumentSelect}
                  onSessionSelect={handleSessionSelect}
                  currentDocumentId={currentDocumentId || ""}
                  handleNewChat={handleNewChat}
                />
              )}
            </div>
          </section>
        </main>
      </div>
      <ConfirmationModal
        isOpen={!!confirmationModalConfig}
        onClose={() => setConfirmationModalConfig(null)}
        onSave={handleConfirmationModal}
        modal={{
          header: confirmationModalConfig?.header || "",
          message: confirmationModalConfig?.message || "",
          trueButton: confirmationModalConfig?.trueButton || "",
          falseButton: confirmationModalConfig?.falseButton || "",
          type: confirmationModalConfig?.type || "",
        }}
      />
    </ProtectedRoute>
  );
}