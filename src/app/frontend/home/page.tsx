// FIXED: Updated Home page with storage usage bar and proper document switching
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import ChatViewer from "./chat-viewer/ChatViewer";
import FileManager from "./file-manager/FileManager";
import ChatHistory from "./chat-viewer/ChatHistory";
import {
  apiService,  profileService,
  SystemStatus,
  UploadResponse,
} from "../../../lib/api";
import { authUtils } from '@/lib/auth';
import {
  GoStarFill
} from "react-icons/go";
import { HiOutlineChatBubbleLeft, HiOutlineChatBubbleLeftEllipsis } from "react-icons/hi2";
import ProtectedRoute from "../components/layout/ProtectedRoute";
import NavBar from "../components/layout/NavBar";
import { useAuth } from "@/lib/context/AuthContext";
import { LogOut, Menu, X, Lock, Palette, PanelRightClose, PanelRightOpen, HardDrive, DiamondPlus, MessageCircle, Folder, Star, ChevronLeft, Gift, CreditCard } from "lucide-react";
import { useTheme } from "next-themes";
import UploadPage from "./chat-viewer/UploadPage";
import ConfirmationModal, { ModalType } from "../components/layout/ConfirmationModal";
import SidebarFooter from "../components/layout/SidebarFooter";
import { FaLandmark } from "react-icons/fa";

type ActiveTab =
  | "chat"
  | "documents"
  | "chat_history"
  | "upload"
  | "voice_chat"

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
  
  // NEW: Recent chat sessions state
  const [recentSessions, setRecentSessions] = useState<Array<{
    id: string;
    title: string;
    documentName: string;
    createdAt: string;
  }>>([]);

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
          case 'STANDARD':
            return 1024 * 1024 * 1024; // 1GB for standard
          case 'BASIC':
            return 10 * 1024 * 1024; // 10MB for basic
          default:
            return 10 * 1024 * 1024; // 10MB for basic
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

    } finally {
      setIsLoadingStorage(false);
    }
  };

  // NEW: Load recent chat sessions
  const loadRecentSessions = async () => {
    if (!user) {
      console.warn('No user available for loading recent sessions');
      setRecentSessions([]);
      return;
    }
    
    try {
      console.log(`📚 Loading recent sessions for user: ${user.id}`);
      const response = await fetch('/backend/api/chat-sessions/recent?limit=4', {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const sessions = await response.json();
        console.log(`✅ Loaded ${sessions.length} recent sessions from API for user ${user.id}`);
        
        // ✅ FIXED: Additional client-side filtering to ensure only current user's sessions
        const userSessions = sessions.filter((session: any) => {
          // If userId is present in the response, verify it matches current user
          if (session.userId) {
            const matches = session.userId === user.id;
            if (!matches) {
              console.warn(`⚠️ Filtering out session ${session.id} - belongs to user ${session.userId}, current user is ${user.id}`);
            }
            return matches;
          }
          // If no userId in response, assume it's correct (backend should have filtered)
          return true;
        });
        
        console.log(`✅ After client-side filtering: ${userSessions.length} sessions for user ${user.id}`);
        setRecentSessions(userSessions.slice(0, 4)); // Ensure we only get top 4
      } else {
        console.warn('Failed to fetch recent sessions:', response.status);
        // Fallback to localStorage if API fails
        loadRecentSessionsFromLocalStorage();
      }
    } catch (error) {
      console.error('Failed to load recent sessions:', error);
      // Fallback to localStorage if API fails
      loadRecentSessionsFromLocalStorage();
    }
  };

  // Fallback: Load recent sessions from localStorage
  const loadRecentSessionsFromLocalStorage = () => {
    try {
      // ✅ FIXED: Ensure proper user isolation with more specific key
      if (!user?.id) {
        console.warn('No user ID available for localStorage key');
        setRecentSessions([]);
        return;
      }
      
      const storageKey = `chat_history_${user.id}`;
      const storedSessions = localStorage.getItem(storageKey);
      
      if (storedSessions) {
        const sessions = JSON.parse(storedSessions);
        
        // ✅ FIXED: Additional user validation to prevent cross-contamination
        const userSessions = sessions.filter((session: any) => {
          // Only include sessions that belong to the current user
          return session.userId === user.id || session.user_id === user.id || !session.userId;
        });
        
        // Sort by updatedAt and take top 4
        const recentSessions = userSessions
          .sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
          .slice(0, 4)
          .map((session: any) => ({
            id: session.id,
            title: session.title || 'Untitled Chat',
            documentName: session.fileName || session.filename || 'Unknown', // Use LLM-renamed fileName first
            createdAt: session.createdAt || new Date().toISOString()
          }));
        
        setRecentSessions(recentSessions);
        console.log(`✅ Loaded ${recentSessions.length} recent sessions from localStorage for user ${user.id}`);
      } else {
        console.log(`No stored sessions found for user ${user.id}`);
        setRecentSessions([]);
      }
    } catch (error) {
      console.error('Failed to load sessions from localStorage:', error);
      setRecentSessions([]);
    }
  };

  // Helper function to truncate session title
  const truncateTitle = (title: string, maxLength: number = 30): string => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  // Helper function to format date for recent sessions
  const formatSessionDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

  // NEW: Load storage info and recent sessions when component mounts and user changes
  useEffect(() => {
    if (user) {
      // ✅ FIXED: Clear recent sessions first to prevent showing old data
      setRecentSessions([]);
      
      // ✅ FIXED: Clear any potential cross-contamination from localStorage
      clearCrossUserData();
      loadStorageInfo();
      loadRecentSessions();
    } else {
      // Clear sessions when user logs out
      setRecentSessions([]);
    }
  }, [user?.id]); // ✅ FIXED: Depend on user.id specifically to trigger on user change

  // ✅ FIXED: Clear localStorage data that might belong to other users
  const clearCrossUserData = () => {
    if (!user?.id) return;
    
    try {
      // Clear any localStorage keys that don't match the current user
      const keysToCheck = [
        'chat_history',
        'uploaded_documents',
        'chat_sessions'
      ];
      
      keysToCheck.forEach(baseKey => {
        const userKey = `${baseKey}_${user.id}`;
        const globalKey = baseKey;
        
        // Keep only the current user's data
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith(baseKey) && key !== userKey && key !== globalKey) {
            console.log(`🧹 Clearing cross-user data: ${key}`);
            localStorage.removeItem(key);
          }
        });
      });
      
      console.log(`✅ Cleared cross-user data for user ${user.id}`);
    } catch (error) {
      console.error('Failed to clear cross-user data:', error);
    }
  };

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
    
    // ✅ FIXED: Refresh recent sessions after new upload (delayed to allow session creation)
    setTimeout(() => {
      loadRecentSessions();
    }, 1000); // Give time for session to be created
    
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
    setCurrentSessionId(null);
  };

  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setActiveTab('chat');
    setIsMobileSidebarOpen(false);
    
    // 🔥 FIXED: Defer document tracking clear to avoid setState during render
    setTimeout(() => clearDocumentTracking(), 0);
  };

  // NEW: Handle recent session click from sidebar
  const handleRecentSessionClick = (sessionId: string) => {
    console.log('📋 Recent session clicked:', sessionId);
    handleSessionSelect(sessionId);
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
        // ✅ FIXED: Clear recent sessions and user data before logout
        setRecentSessions([]);
        clearDocumentTracking();
        clearLastUploadedDocument();
        logout();
      }
    );
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const menuItems = [
    { id: 'chat_history', label: 'Chat History', icon: HiOutlineChatBubbleLeftEllipsis },
    { id: 'documents', label: 'File Manager', icon: Folder },
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
              className="md:hidden self-end mb-2 p-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Navigation Buttons */}
            <div className={`space-y-1 mb-2 flex flex-col ${!isDesktopSidebarCollapsed ? 'items-end' : 'items-center'}`}>
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
                className={`w-full relative text-white bg-blue cursor-pointer flex items-center ${isDesktopSidebarCollapsed ? 'justify-center' : 'gap-3'} text-left p-3 mb-2 rounded-md transition-colors`}
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
                    className={`w-full relative cursor-pointer flex items-center gap-3 text-left p-3 rounded-md transition-colors ${
                      activeTab === item.id
                        ? 'bg-blue/10 text-blue-700 font-semibold rounded'
                        : 'text-foreground hover:bg-accent'
                    }`}
                  >
                    <IconComponent className={`${activeTab === item.id && !isDesktopSidebarCollapsed ? 'ml-1 stroke-2' : 'ml-0' } transition-all duration-300 w-5 h-5 flex-shrink-0`} strokeWidth={1.5}/>
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

            {/* NEW: Recent Chat Sessions - Only show when sidebar is expanded */}
            {!isDesktopSidebarCollapsed && user && recentSessions.length > 0 && (
              <div className="flex-1 overflow-y-hidden mb-4">
                <div className="px-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recent</span>
                  </div>
                  <div className="space-y-1">
                    {recentSessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => handleRecentSessionClick(session.id)}
                        className={`w-full text-left p-2 rounded-md transition-colors group hover:bg-accent cursor-pointer ${
                          currentSessionId === session.id ? 'bg-accent' : ''
                        }`}
                        title={session.title}
                      >
                        <div className="flex items-start gap-2">
                          <HiOutlineChatBubbleLeftEllipsis className="w-4 h-4 text-blue flex-shrink-0 mt-0.5" strokeWidth={2} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground truncate">
                              {truncateTitle(session.title)}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <span className="truncate">{session.documentName}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

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
                className={`w-full flex items-center ${isDesktopSidebarCollapsed ? 'justify-center' : 'justify-center gap-2'} text-sm p-3 py-2 rounded-md ${
                  theme === "dark"
                    ? "text-destructive hover:bg-destructive/10 border border-destructive"
                    : "text-destructive hover:bg-destructive/10 border border-destructive"
                } transition-colors cursor-pointer`}
                title={isDesktopSidebarCollapsed ? "Sign out" : ""}
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                {!isDesktopSidebarCollapsed && <span className="truncate">Sign out</span>}
              </button>
            </div>
            
            {!isDesktopSidebarCollapsed && (
              <SidebarFooter />
            )}
          </aside>

          {/* Main Content Area */}
          <section className="flex-1  bg-panel flex flex-col overflow-hidden">
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
                    // ✅ FIXED: Refresh recent sessions when a session is deleted
                    loadRecentSessions();
                  }}
                  onClearStateCallback={setClearChatViewerFn}
                  lastUploadedDocumentId={lastUploadedDocumentId || ''}
                  onSessionCreated={loadRecentSessions} // ✅ FIXED: Refresh recent sessions when new session is created
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
                  onSessionsChanged={loadRecentSessions} // ✅ FIXED: Refresh recent sessions when sessions change
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