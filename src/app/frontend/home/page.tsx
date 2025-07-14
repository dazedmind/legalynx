// Updated Home page to handle session selection
'use client';

import React, { useState, useEffect } from 'react';
import ChatViewer from '../components/ChatViewer';
import FileManager from '../components/FileManager';
import ChatHistory from '../components/ChatHistory';
import { apiService, handleApiError, SystemStatus, UploadResponse } from '../lib/api';
import { GoComment, GoFile, GoHistory } from "react-icons/go";
import NavBar from '../components/NavBar';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '@/lib/context/AuthContext';
import { Plus } from 'lucide-react';
import UploadPage from '../components/UploadPage';

type ActiveTab = 'chat' | 'documents' | 'chat_history' | 'upload';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null); // Add this
  const { user, logout, isPaidUser } = useAuth();

  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

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

  const handleUploadSuccess = (response: UploadResponse) => {
    setNotification({
      type: 'success',
      message: `Successfully processed ${response.filename} with ${response.pages_processed} pages!`
    });
    
    setTimeout(() => {
      loadSystemStatus();
    }, 1000);
    
    setTimeout(() => {
      setNotification(null);
    }, 5000);

    setActiveTab('chat');
  };

  const handleNewChat = () => {
    setActiveTab('upload');
    // Clear current session when starting new chat
    setCurrentSessionId(null);
    setCurrentDocumentId(null);
  };

  const handleTabClick = (tab: ActiveTab) => {
    setActiveTab(tab);
  };

  const handleDocumentSelect = async (docId: string) => {
    setCurrentDocumentId(docId);
    
    const savedDocs = localStorage.getItem('uploaded_documents');
    if (savedDocs) {
      const docs = JSON.parse(savedDocs);
      const selectedDoc = docs.find((doc: any) => doc.id === docId);
      
      if (selectedDoc) {
        setActiveTab('chat');
      }
    }
  };

  // Add this new handler for session selection
  const handleSessionSelect = async (sessionId: string, documentId: string) => {
    setCurrentSessionId(sessionId);
    setCurrentDocumentId(documentId);
    setActiveTab('chat');
  };

  const handleSystemReset = async () => {
    if (!confirm('Are you sure you want to reset the system? This will clear the current session but keep your saved documents.')) {
      return;
    }

    try {
      await apiService.resetSystem();
      setCurrentDocumentId(null);
      setCurrentSessionId(null); // Also clear session
      
      setNotification({
        type: 'success',
        message: 'System reset successfully!'
      });
      loadSystemStatus();
    } catch (error) {
      setNotification({
        type: 'error',
        message: handleApiError(error)
      });
    }

    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const isSystemReady = systemStatus?.pdf_loaded && systemStatus?.index_ready;

  return (
    <ProtectedRoute>
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm border-b flex-shrink-0">
        <NavBar />
      </header>

      {/* Main Content */}
      <main className="flex bg-white flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-1/5 bg-neutral-100 p-6 flex flex-col border-r border-gray-200 flex-shrink-0">
          {/* Navigation Buttons */}
   
          <div className="space-y-2 mb-8">
            <button
              onClick={() => handleTabClick('chat')}
              className={`w-full cursor-pointer flex items-center gap-3 text-left p-3 rounded-lg transition-colors ${
                activeTab === 'chat'
                  ? 'bg-blue-100 text-blue-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <GoComment className="w-5 h-5" />
              Chat with Lynx AI
              {isSystemReady && (
                <span className="ml-auto w-2 h-2 bg-green-500 rounded-full"></span>
              )}
            </button>

            <button
              onClick={() => handleTabClick('documents')}
              className={`w-full cursor-pointer flex items-center gap-3 text-left p-3 rounded-lg transition-colors ${
                activeTab === 'documents'
                  ? 'bg-blue-100 text-blue-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <GoFile className="w-5 h-5" />
              My Documents
            </button>

            <button
              onClick={() => handleTabClick('chat_history')}
              className={`w-full cursor-pointer flex items-center gap-3 text-left p-3 rounded-lg transition-colors ${
                activeTab === 'chat_history'
                  ? 'bg-blue-100 text-blue-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <GoHistory className="w-5 h-5" />
              Chat History
            </button>
          </div>

          <div className="mt-auto space-y-3">
            <button
              onClick={handleSystemReset}
              className="w-full flex items-center justify-center gap-2 text-sm p-3 rounded-lg text-orange-600 hover:bg-orange-50 border border-orange-200 transition-colors"
            >
              Reset Session
            </button>
          </div>
        </aside>
        
        {/* Main Content Area */}
        <section className="flex-1 flex flex-col overflow-hidden">
          {/* Notification Bar */}
          {notification && (
            <div className="flex-shrink-0 p-4">
              <div
                className={`p-4 rounded-md border ${
                  notification.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {notification.message}  
              </div>
            </div>
          )}

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">

            {activeTab === 'chat' && (
              <ChatViewer 
                isSystemReady={!!isSystemReady} 
                onUploadSuccess={handleUploadSuccess}
                selectedSessionId={currentSessionId || ''} // Pass the selected session ID
              />
            )}

            {activeTab === 'documents' && (
              <FileManager 
                onDocumentSelect={handleDocumentSelect}
                currentDocumentId={currentDocumentId || ''}
              />
            )}

            {activeTab === 'chat_history' && (
              <ChatHistory 
                onDocumentSelect={handleDocumentSelect}
                onSessionSelect={handleSessionSelect} // Pass the new handler
                currentDocumentId={currentDocumentId || ''}
              />
            )}
          </div>
        </section>
      </main>
    </div>
    </ProtectedRoute>
  );
}