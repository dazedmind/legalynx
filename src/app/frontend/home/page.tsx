// Updated Home page with collapsible mobile sidebar
'use client';

import React, { useState, useEffect } from 'react';
import ChatViewer from '../components/ChatViewer';
import FileManager from '../components/FileManager';
import ChatHistory from '../components/ChatHistory';
import { apiService, handleApiError, SystemStatus, UploadResponse } from '../lib/api';
import { GoArchive, GoComment, GoFile, GoFileDirectory, GoHistory } from "react-icons/go";
import NavBar from '../components/NavBar';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '@/lib/context/AuthContext';
import { LogOut, Plus, Menu, X, Mic } from 'lucide-react';
import UploadPage from '../components/UploadPage';
  import ConfirmationModal, { ModalType } from '../components/ConfirmationModal';

type ActiveTab = 'chat' | 'documents' | 'chat_history' | 'upload' | 'voice_chat';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('upload');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false); // Mobile sidebar state
  const { user, logout } = useAuth();
  const [resetChatViewer, setResetChatViewer] = useState(false);
  
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

  // Clear uploaded files and reset system on page load
  useEffect(() => {
    const clearUploadedFiles = async () => {
      try {
        await loadSystemStatus();
        console.log('✅ Page loaded, checking system status');
      } catch (error) {
        console.error('Failed to load system status:', error);
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

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadSystemStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const status = await apiService.getStatus();
      setSystemStatus(status);
    } catch (error) {
      console.error('Failed to load system status:', error);
      setSystemStatus(null);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleDocumentDeleted = async (deletedDocId: string) => {
    if (deletedDocId === currentDocumentId) {
      setCurrentDocumentId(null);
      setCurrentSessionId(null);
      setActiveTab('upload');
      
      try {
        await apiService.resetSystem();
        await loadSystemStatus();
      } catch (error) {
        console.error('Failed to reset system after document deletion:', error);
      }
    }
  };

  const handleDocumentSelect = async (docId: string) => {
    setCurrentDocumentId(docId);
    
    const savedDocs = localStorage.getItem('uploaded_documents');
    if (savedDocs) {
      const docs = JSON.parse(savedDocs);
      const selectedDoc = docs.find((doc: any) => doc.id === docId);
      
      if (selectedDoc) {
        setActiveTab('chat');
        setIsMobileSidebarOpen(false); // Close sidebar on mobile after selection
      }
    }
  };

  const handleUploadSuccess = (response: UploadResponse) => {
    console.log('🎉 MAIN COMPONENT - Upload success:', response);
    
    // ✅ FIXED: Add debug logging to see what we receive
    console.log('📄 Response fields:', {
      documentId: response.documentId,
      fileName: response.fileName,
      originalFileName: response.originalFileName,
      fileSize: response.fileSize,
      pageCount: response.pageCount,
      pages_processed: response.pageCount, // Check if this exists
      uploadedAt: response.uploadedAt,
      status: response.status
    });
    
    // Store in localStorage with correct field names for ChatViewer
    const storageKey = user?.id ? `uploaded_documents_${user.id}` : 'uploaded_documents';
    
    const existingDocs = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    // Remove any existing document with same ID
    const filteredDocs = existingDocs.filter((doc: any) => doc.id !== response.documentId);
    
    // ✅ FIXED: Add the new document with correct field mapping from response
    const documentForStorage = {
      id: response.documentId,
      fileName: response.fileName,
      originalFileName: response.originalFileName,
      original_file_name: response.originalFileName,         // Backward compatibility
      fileSize: response.fileSize,
      file_size: response.fileSize,                         // Backward compatibility
      pageCount: response.pageCount || response.pageCount || 1, // ✅ FIXED: Handle both field names
      page_count: response.pageCount || response.pageCount || 1, // ✅ FIXED: Handle both field names
      status: response.status || 'TEMPORARY',
      uploadedAt: response.uploadedAt,
      uploaded_at: response.uploadedAt,                     // Backward compatibility
      databaseId: response.documentId,
      mimeType: response.mimeType,
      securityStatus: response.securityStatus,
      conversionPerformed: response.conversionPerformed,
    };
    
    filteredDocs.unshift(documentForStorage);
    localStorage.setItem(storageKey, JSON.stringify(filteredDocs));
    
    console.log('📄 Document stored in localStorage:', documentForStorage);
    
    // Set current document ID and switch to chat view
    setCurrentDocumentId(response.documentId || '');
    setActiveTab('chat');
    setIsMobileSidebarOpen(false); // Close mobile sidebar
    
    console.log('🔄 Switched to chat tab with document ID:', response.documentId);
  };

  const handleNewChat = () => {
    setActiveTab('upload');
    setCurrentSessionId(null);
    setCurrentDocumentId(null);
    setIsMobileSidebarOpen(false); // Close sidebar on mobile
  };

  const handleVoiceChat = () => {
    setActiveTab('voice_chat');
    setIsMobileSidebarOpen(false); // Close sidebar on mobile
  };

  const handleTabClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileSidebarOpen(false); // Close sidebar on mobile after tab selection
  };

  const handleSessionSelect = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setActiveTab('chat');
    setIsMobileSidebarOpen(false); // Close sidebar on mobile
  };

  const handleSignOut = () => {
    openConfirmationModal(
      {
        header: 'Sign out',
        message: 'Are you sure you want to sign out?',
        trueButton: 'Sign out',
        falseButton: 'Cancel',
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
    { id: 'chat_history', label: 'Chat History', icon: GoArchive },
    { id: 'documents', label: 'My Documents', icon: GoFileDirectory },
  ];

  const isSystemReady = systemStatus?.pdfLoaded && systemStatus?.indexReady;

  return (
    <ProtectedRoute>
      <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b flex-shrink-0 flex px-6 md:px-0">
            <div className='flex items-center justify-between'>
            <button
                onClick={toggleMobileSidebar}
                className="lg:hidden bg-white rounded-lg p-2 border"
              >
                {isMobileSidebarOpen ? (
                  <X className="w-6 h-6 text-gray-600" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-600" />
                )}
              </button>
            </div>
              <div className='flex-1 items-center justify-between'>
                <NavBar />
              </div>
        </header>

        {/* Main Content */}
        <main className="flex bg-white flex-1 overflow-hidden relative">
          {/* Mobile Overlay */}
          {isMobileSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/20 z-40 md:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside className={`
            fixed md:relative inset-y-0 left-0 z-50 md:z-0
            w-64 md:w-1/5 bg-neutral-100 p-4 md:p-6 
            flex flex-col border-r border-gray-200 flex-shrink-0
            transform transition-transform duration-300 ease-in-out
            ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}>
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
                onClick={() => handleTabClick('chat_history')}
                className={`w-full relative cursor-pointer flex items-center gap-3 text-left p-3 rounded-r-lg transition-colors ${
                  activeTab === 'chat_history' || activeTab === 'chat'
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                  {activeTab === 'chat_history' && (
                    <div className="h-full w-1 bg-blue-700 absolute left-0 overflow-hidden rounded-full"></div>
                  )}
                <GoArchive className={`${activeTab === 'chat_history' ? 'ml-2' : 'ml-0' } transition-all duration-300 w-5 h-5 flex-shrink-0`} />
                <span className="truncate">Chat History</span>
              </button>

              <button
                onClick={() => handleTabClick('documents')}
                className={`w-full relative cursor-pointer flex items-center gap-3 text-left p-3 rounded-r-lg transition-colors ${
                  activeTab === 'documents'
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                {activeTab === 'documents' && (
                    <div className="h-full w-1 bg-blue-700 absolute left-0 overflow-hidden rounded-full"></div>
                  )}
                <GoFileDirectory className={`${activeTab === 'documents' ? 'ml-2' : 'ml-0' } transition-all duration-300 w-5 h-5 flex-shrink-0`} />
                <span className="truncate">My Documents</span>
              </button>

            </div>

            <div className="mt-auto space-y-3">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 text-sm p-3 rounded-lg text-red-600 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Sign out</span>
              </button>
            </div>
          </aside>
        
          {/* Main Content Area */}
          <section className="flex-1 flex flex-col overflow-hidden">
            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'upload' && (
                <UploadPage 
                  onUploadSuccess={handleUploadSuccess}
                />
              )}
              
              {activeTab === 'chat' && (
                <ChatViewer 
                  isSystemReady={!!isSystemReady} 
                  onUploadSuccess={handleUploadSuccess}
                  selectedSessionId={currentSessionId || ''} 
                  handleNewChat={handleNewChat}
                  handleVoiceChat={handleVoiceChat}
                />
              )}

              {activeTab === 'documents' && (
                <FileManager 
                  onDocumentSelect={handleDocumentSelect}
                  onDocumentDeleted={handleDocumentDeleted}
                  currentDocumentId={currentDocumentId || ''}
                />
              )}

              {activeTab === 'chat_history' && (
                <ChatHistory 
                  onDocumentSelect={handleDocumentSelect}
                  onSessionSelect={handleSessionSelect}
                  currentDocumentId={currentDocumentId || ''}
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
           header: confirmationModalConfig?.header || '',
           message: confirmationModalConfig?.message || '',
           trueButton: confirmationModalConfig?.trueButton || '',
           falseButton: confirmationModalConfig?.falseButton || '',
           type: confirmationModalConfig?.type || '',
         }}
      />
    </ProtectedRoute>
  );
}