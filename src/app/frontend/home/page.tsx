// FIXED: Updated Home page with storage usage bar and proper document switching
"use client";

import React, { useState, useEffect, useRef } from "react";
import ChatViewer from "./tabs/chat-viewer/ChatViewer";
import FileManager from "./tabs/file-manager/FileManager";
import ChatHistory from "./tabs/chat-viewer/ChatHistory";
import Appearance from "./tabs/appearance/Appearance";
import SubscriptionPage from "./tabs/subscription/SubscriptionPage";
import {
  apiService,  profileService,
  SystemStatus,
  UploadResponse,
} from "../lib/api";
import { authUtils } from '@/lib/auth';
import {
  GoFileDirectory,
  GoComment,
  GoStarFill
} from "react-icons/go";
import ProtectedRoute from "../components/ProtectedRoute";
import NavBar from "../components/NavBar";
import { useAuth } from "@/lib/context/AuthContext";
import { LogOut, Menu, X, Lock, Palette, PanelRightClose, PanelRightOpen, HardDrive, DiamondPlus, MessageCircle, Folder, Star, ChevronLeft, Gift, CreditCard } from "lucide-react";
import { useTheme } from "next-themes";
import UploadPage from "./tabs/chat-viewer/UploadPage";
import ConfirmationModal, { ModalType } from "../components/ConfirmationModal";

type ActiveTab =
  | "chat"
  | "documents"
  | "chat_history"
  | "upload"
  | "voice_chat"
  | "appearance"
  | "subscription";

interface StorageInfo {
  used: number;
  total: number;
  usedPercentage: number;
  planType: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("upload");
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // NEW: Desktop sidebar collapse state
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  
  // NEW: Storage usage state
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    used: 0,
    total: 0,
    usedPercentage: 0,
    planType: 'BASIC'
  });
  const [isLoadingStorage, setIsLoadingStorage] = useState(false);
  
  // FIXED: Add state to track uploads and session management
  const [isProcessingNewUpload, setIsProcessingNewUpload] = useState(false);
  const [lastProcessedDocumentId, setLastProcessedDocumentId] = useState<string | null>(null);
  const [uploadCompleted, setUploadCompleted] = useState(false);
  
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [subscriptionStatus, setSubscriptionStatus] = useState("");
  
  const [lastUploadedDocumentId, setLastUploadedDocumentId] = useState<string | null>(null);

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

  const clearLastUploadedDocument = () => {
    console.log('🧹 Clearing last uploaded document tracking');
    setLastUploadedDocumentId(null);
  };

  const getAuthHeaders = (): HeadersInit => {
    const token = authUtils.getToken();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  // NEW: Load storage information
  const loadStorageInfo = async () => {
    if (!user) return;
    setIsLoadingStorage(true);
    try {
      const [storageResponse, profileResponse] = await Promise.all([
        fetch('/backend/api/user-settings/storage', {
          method: 'GET',
          headers: getAuthHeaders(),
        }),
        profileService.getProfile(),
      ]);

      let storageData = { used: 0, total: 0 };
      if (storageResponse.ok) {
        storageData = await storageResponse.json();
      } else {
        console.warn('Failed to fetch storage info:', storageResponse.status);
      }

      const planType = profileResponse.subscription?.plan_type?.toUpperCase() || 'BASIC';
      
      // [Unverified] Plan storage limits - adjust based on your actual limits
      const getStorageLimit = (plan: string) => {
        switch (plan) {
          case 'PREMIUM':
            return 10 * 1024 * 1024 * 1024; // 10GB for premium
          case 'BASIC':
          default:
            return 100 * 1024 * 1024; // 100MB for basic
        }
      };

      const totalStorage = storageData.total || getStorageLimit(planType);
      const usedStorage = storageData.used || 0;
      const usedPercentage = totalStorage > 0 ? (usedStorage / totalStorage) * 100 : 0;

      setStorageInfo({
        used: usedStorage,
        total: totalStorage,
        usedPercentage: Math.min(usedPercentage, 100),
        planType
      });

    } catch (error) {
      console.error('Failed to load storage info:', error);
      // [Unverified] Set default values on error
      setStorageInfo({
        used: 0,
        total: 100 * 1024 * 1024, // 100MB default
        usedPercentage: 0,
        planType: 'BASIC'
      });
    } finally {
      setIsLoadingStorage(false);
    }
  };

  // Helper function to format bytes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Get storage bar color based on usage
  const getStorageBarColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-blue-500';
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

  // NEW: Toggle desktop sidebar collapse
  const toggleDesktopSidebar = () => {
    setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed);
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

  // NEW: Load storage info when component mounts and user changes
  useEffect(() => {
    if (user) {
      loadStorageInfo();
    }
  }, [user]);

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
        // Refresh storage info after document deletion
        await loadStorageInfo();
      } catch (error) {
        console.error("Failed to reset system after document deletion:", error);
      }
    }
  };
  
  const handleDocumentSelect = async (docId: string) => {
    console.log('🏠 handleDocumentSelect called with docId:', docId);
    
    // ✅ FIXED: Clear both tracking states to ensure document loads fresh
    setLastUploadedDocumentId(null);
    setLastProcessedDocumentId(null);
    setCurrentDocumentId(docId);
    
    console.log('🏠 Set currentDocumentId to:', docId);
    
    // Always switch to chat tab when selecting a document
    console.log('🏠 Switching to chat tab');
    setActiveTab('chat');
    setIsMobileSidebarOpen(false);
  };

  // FIXED: Enhanced upload success handler with proper document switching
  const handleUploadSuccess = (response: UploadResponse) => {
    console.log('🎉 MAIN COMPONENT - Upload success:', response);
    
    // ✅ FIXED: Add debug logging to see what we receive
    console.log('📄 Response fields:', {
      documentId: response.documentId,
      fileName: response.fileName,
      originalFileName: response.originalFileName,
      fileSize: response.fileSize,
      pageCount: response.pageCount,
      pages_processed: response.pageCount,
      uploadedAt: response.uploadedAt,
      status: response.status
    });
    
    // Store in localStorage with correct field names for ChatViewer
    const storageKey = user?.id ?
      `uploaded_documents_${user.id}` : 'uploaded_documents';
    
    const existingDocs = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    // Remove any existing document with same ID
    const filteredDocs = existingDocs.filter((doc: any) => doc.id !== response.documentId);
    
    // ✅ FIXED: Add the new document with correct field mapping from response
    const documentForStorage = {
      id: response.documentId,
      fileName: response.fileName,
      originalFileName: response.originalFileName,
      original_file_name: response.originalFileName,
      fileSize: response.fileSize,
      file_size: response.fileSize,
      pageCount: response.pageCount || response.pageCount || 1,
      page_count: response.pageCount || response.pageCount || 1,
      status: response.status || 'TEMPORARY',
      uploadedAt: response.uploadedAt,
      uploaded_at: response.uploadedAt,
      databaseId: response.documentId,
      mimeType: response.mimeType,
      securityStatus: response.securityStatus,
      conversionPerformed: response.conversionPerformed,
    };
    
    filteredDocs.unshift(documentForStorage);
    localStorage.setItem(storageKey, JSON.stringify(filteredDocs));
    
    console.log('📄 Document stored in localStorage:', documentForStorage);
    
    // 🔥 FIXED: Set the last uploaded document ID to ensure ChatViewer loads the correct document
    setLastUploadedDocumentId(response.documentId || '');
    
    // 🔥 FIXED: Clear any previous currentDocumentId to prevent conflicts
    setCurrentDocumentId(response.documentId || '');
    setActiveTab('chat');
    setIsMobileSidebarOpen(false);
    
    console.log('🔄 Switched to chat tab with document ID:', response.documentId);
  };
  
  const clearDocumentTracking = () => {
    console.log('🧹 Clearing document tracking');
    setCurrentDocumentId(null);
    setLastUploadedDocumentId(null);
  };

  // FIXED: Enhanced new chat handler with proper state clearing
  const handleNewChat = () => {
    setActiveTab('upload');
    setCurrentSessionId(null);
    setIsMobileSidebarOpen(false);
    
    // 🔥 FIXED: Defer document tracking clear to avoid setState during render
    setTimeout(() => {
      clearDocumentTracking();
      console.log('🔄 Started new chat, cleared all tracking');
    }, 0);
  };

  // If using the callback approach, update your Home component like this:
  const [clearChatViewerFn, setClearChatViewerFn] = useState<(() => void) | null>(null);
  const [pendingClearChatViewer, setPendingClearChatViewer] = useState(false);

  // In handleClearPreviousSession:
  const clearChatViewerState = () => {
    // Defer clearing ChatViewer until after this render commit
    // to avoid setState during parent render warnings.
    console.log('🧹 Scheduling ChatViewer state clear');
    // Double defer: schedule flag in next tick to avoid firing during render
    setTimeout(() => setPendingClearChatViewer(true), 0);
  };

  // Perform the actual clear after render commit (scheduled to avoid cross-render updates)
  useEffect(() => {
    if (pendingClearChatViewer && clearChatViewerFn) {
      const timeoutId = setTimeout(() => {
        console.log('🧹 Executing deferred ChatViewer state clear');
        try {
          clearChatViewerFn();
        } finally {
          setPendingClearChatViewer(false);
        }
      }, 0);
      return () => clearTimeout(timeoutId);
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

  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setActiveTab('chat');
    setIsMobileSidebarOpen(false);
    
    // 🔥 FIXED: Defer document tracking clear to avoid setState during render
    setTimeout(() => clearDocumentTracking(), 0);
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

    // 🔥 FIXED: Defer clearing to avoid setState during render
    setTimeout(() => {
      clearDocumentTracking();
      clearLastUploadedDocument();
    }, 0);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const menuItems = [
    { id: 'chat_history', label: 'Chat History', icon: MessageCircle },
    { id: 'documents', label: 'File Manager', icon: Folder },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'subscription', label: 'Subscription', icon: Star }
  ]

  const isSystemReady = systemStatus?.pdfLoaded && systemStatus?.indexReady;

  return (
    <ProtectedRoute>
      <div className="h-screen bg-primary flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-primary shadow-sm border-b flex-shrink-0 flex px-6 md:px-0">
          <div className="flex items-center justify-between">
            <button
              onClick={toggleMobileSidebar}
              className="lg:hidden bg-primary"
            >
              {isMobileSidebarOpen ? (
                <ChevronLeft className="w-6 h-6 text-gray-600" />
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
            ${isDesktopSidebarCollapsed ? 'w-20' : 'w-64 md:w-1/5'} 
            bg-primary p-4
            flex flex-col border-r flex-shrink-0
            transform transition-all duration-300 ease-in-out
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
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Navigation Buttons */}
            <div className={`space-y-2 mb-8 flex flex-col ${!isDesktopSidebarCollapsed ? 'items-end' : 'items-center'}`}>

              {/* NEW: Desktop Collapse Button - Top Right Corner */}
              <div className="hidden mb-4 md:flex">
                <button
                  onClick={toggleDesktopSidebar}
                  className="justify-center transition-colors cursor-pointer"
                  title={isDesktopSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {isDesktopSidebarCollapsed ? (
                    <PanelRightClose className="w-5 h-5 text-foreground flex-shrink-0" strokeWidth={1.5} />
                  ) : (
                    <PanelRightOpen className="w-5 h-5 text-foreground  flex-shrink-0" />
                  )}
                </button>
              </div>

              {/* TAB BUTTONS */}
              <button
                onClick={() => handleTabClick("upload")}
                className={`w-full relative text-white bg-gradient-to-bl from-blue-800 to-blue-400 cursor-pointer flex items-center ${isDesktopSidebarCollapsed ? 'justify-center' : 'gap-3'} text-left p-3 rounded-lg transition-colors`}
                title={isDesktopSidebarCollapsed ? "New Chat" : ""}
              >
                <DiamondPlus
                  className={`transition-all duration-300 w-6 h-6 flex-shrink-0`}
                  strokeWidth={1.5}
                />
                {!isDesktopSidebarCollapsed && <span className="truncate text-md">New Chat</span>}
              </button>

              {menuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id as ActiveTab)}
                    className={`w-full relative cursor-pointer flex items-center gap-3 text-left p-3 rounded-lg transition-colors ${
                      activeTab === item.id
                        ? 'bg-blue/10 text-blue-700 font-semibold rounded-r-lg '
                        : 'text-foreground hover:bg-accent'
                    }`}
                  >
                    {activeTab === item.id && (
                      <div className="h-full w-1 bg-blue-700 absolute left-0 overflow-hidden rounded-full"></div>
                    )}
                    <IconComponent className={`${activeTab === item.id && !isDesktopSidebarCollapsed ? 'ml-2 stroke-2' : 'ml-0' } transition-all duration-300 w-5 h-5 flex-shrink-0`} strokeWidth={1.5}/>
                    <div className="flex items-center justify-between gap-2 w-full">
                      {!isDesktopSidebarCollapsed && <span className="truncate">{item.label}</span>}
                      {item.id === "documents" && subscriptionStatus === "BASIC" && (
                        <div className="bg-gradient-to-tr from-blue-500 to-blue-400 text-white rounded-full p-2 text-xs">
                          <GoStarFill className="w-4 h-4 flex-shrink-0 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}

            </div>

            <div className="mt-auto space-y-3">
              {/* NEW: Storage Usage Bar */}
              {user && !isDesktopSidebarCollapsed && (
                <div className="p-3 bg-tertiary rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-foreground">Storage</span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-muted rounded-full h-2 mb-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${getStorageBarColor(storageInfo.usedPercentage)}`}
                      style={{ width: `${Math.min(storageInfo.usedPercentage, 100)}%` }}
                    />
                  </div>
                  
                  {/* Storage Info */}
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatBytes(storageInfo.used)} used</span>
                    <span>{formatBytes(storageInfo.total)} total</span>
                  </div>
                  
                  {/* Upgrade prompt for basic users near limit */}
                  {storageInfo.planType === 'BASIC' && storageInfo.usedPercentage > 80 && (
                    <div className="mt-2 pt-2 border-t border-muted">
                      <button
                        onClick={() => window.location.href = '/frontend/pricing'}
                        className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer"
                      >
                        Upgrade for more storage →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Collapsed Storage Indicator */}
              {user && isDesktopSidebarCollapsed && (
                <div className="flex justify-center">
                  <div 
                    className="relative cursor-pointer group"
                    title={`Storage: ${Math.round(storageInfo.usedPercentage)}% used`}
                  >
                    <HardDrive className={`w-5 h-5 ${
                      storageInfo.usedPercentage > 90 ? 'text-red-500' :
                      storageInfo.usedPercentage > 75 ? 'text-yellow-500' :
                      'text-muted-foreground'
                    }`} />
                    {storageInfo.usedPercentage > 90 && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={handleSignOut}
                className={`w-full flex items-center ${isDesktopSidebarCollapsed ? 'justify-center' : 'justify-center gap-2'} text-sm p-3 rounded-lg ${
                  theme === "dark"
                    ? "text-red-600 hover:bg-red-100 border border-red-500"
                    : "text-red-600 hover:bg-red-100 border border-red-200"
                } transition-colors cursor-pointer`}
                title={isDesktopSidebarCollapsed ? "Sign out" : ""}
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                {!isDesktopSidebarCollapsed && <span className="truncate">Sign out</span>}
              </button>
            </div>
            
            {!isDesktopSidebarCollapsed && (
              <div className="flex items-center text-xs gap-1 mt-4 border-t border-tertiary pt-2 text-muted-foreground">
                <a href="/frontend/privacy-policy" target="_blank" rel="noopener noreferrer">
                  Privacy Policy •
                </a>
                <p className="text-xs text-muted-foreground">v 0.3.5</p>
              </div>
            )}
          </aside>

          {/* Main Content Area */}
          <section className="flex-1 flex flex-col overflow-hidden">
            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
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
                  lastUploadedDocumentId={lastUploadedDocumentId || ''}
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

              {activeTab === "appearance" && (
                <Appearance />
              )}

              {activeTab === "subscription" && (
                <SubscriptionPage />
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