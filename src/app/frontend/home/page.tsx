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
import { LogOut, Plus, Menu, X } from 'lucide-react';
import UploadPage from '../components/UploadPage';

type ActiveTab = 'chat' | 'documents' | 'chat_history' | 'upload';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('upload');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false); // Mobile sidebar state
  const { user, logout } = useAuth();
  const [resetChatViewer, setResetChatViewer] = useState(false);

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
    console.log('📤 Upload success in Home component:', response);
    
    if (response && response.documentId) {
      setCurrentDocumentId(response.documentId);
      setCurrentSessionId(null);
      setActiveTab('chat');
      console.log('🔄 Switched to chat tab for document:', response.documentId);
    }
    
    setTimeout(() => {
      loadSystemStatus();
    }, 1000);
  };

  const handleNewChat = () => {
    setActiveTab('upload');
    setCurrentSessionId(null);
    setCurrentDocumentId(null);
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

  const handleSystemReset = async () => {
    if (!confirm('Are you sure you want to reset the system? This will clear the current session but keep your saved documents.')) {
      return;
    }

    try {
      await apiService.resetSystem();
      setCurrentDocumentId(null);
      setCurrentSessionId(null);
      loadSystemStatus();
    } catch (error) {
      // Handle error
    }
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const menuItems = [
    { id: 'chat_history', label: 'Chat History', icon: GoArchive },
    { id: 'documents', label: 'My Documents', icon: GoFileDirectory },
  ];

  const isSystemReady = systemStatus?.pdf_loaded && systemStatus?.index_ready;

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
                className={`w-full cursor-pointer flex items-center gap-3 text-left p-3 rounded-lg transition-colors ${
                  activeTab === 'chat_history' || activeTab === 'chat'
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <GoArchive className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">Chat History</span>
              </button>

              <button
                onClick={() => handleTabClick('documents')}
                className={`w-full cursor-pointer flex items-center gap-3 text-left p-3 rounded-lg transition-colors ${
                  activeTab === 'documents'
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <GoFileDirectory className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">My Documents</span>
              </button>
            </div>

            <div className="mt-auto space-y-3">
              <button
                onClick={logout}
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
    </ProtectedRoute>
  );
}