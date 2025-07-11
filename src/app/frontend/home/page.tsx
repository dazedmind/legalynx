'use client';

import React, { useState, useEffect } from 'react';
import CombinedUploadQueryComponent from '../components/UploadQueryComponent';
import FileManager from '../components/FileManager';
import ChatHistory from '../components/ChatHistory';
import { apiService, handleApiError, SystemStatus, UploadResponse } from '../lib/api';
import { GoComment, GoFile, GoHistory } from "react-icons/go";
import NavBar from '../components/NavBar';

type ActiveTab = 'chat' | 'documents' | 'chat_history';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Clear uploaded files and reset system on page load
  useEffect(() => {
    const clearUploadedFiles = async () => {
      try {
        // Clear localStorage
        localStorage.removeItem('uploaded_documents');
        localStorage.removeItem('rag_chat_history');
        
        // Reset backend system
        await apiService.resetSystem();
        
        console.log('✅ Cleared uploaded files and reset system');
      } catch (error) {
        console.error('Failed to reset system on page load:', error);
      }
    };

    clearUploadedFiles();
    loadSystemStatus();
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
    
    // Refresh system status after successful upload
    setTimeout(() => {
      loadSystemStatus();
    }, 1000);
    
    // Clear notification after 5 seconds
    setTimeout(() => {
      setNotification(null);
    }, 5000);

    // Switch to chat tab after successful upload
    setActiveTab('chat');
  };

  const handleTabClick = (tab: ActiveTab) => {
    setActiveTab(tab);
  };

  const handleDocumentSelect = async (docId: string) => {
    setCurrentDocumentId(docId);
    
    // Get document info from localStorage
    const savedDocs = localStorage.getItem('uploaded_documents');
    if (savedDocs) {
      const docs = JSON.parse(savedDocs);
      const selectedDoc = docs.find((doc: any) => doc.id === docId);
      
      if (selectedDoc) {
        setNotification({
          type: 'success',
          message: `Selected document: ${selectedDoc.originalName}`
        });

        // Clear notification after 3 seconds
        setTimeout(() => {
          setNotification(null);
        }, 3000);

        // Switch to chat tab
        setActiveTab('chat');
      }
    }
  };

  const handleSystemReset = async () => {
    if (!confirm('Are you sure you want to reset the system? This will clear all uploaded documents and indices.')) {
      return;
    }

    try {
      await apiService.resetSystem();
      localStorage.removeItem('uploaded_documents');
      localStorage.removeItem('rag_chat_history');
      setCurrentDocumentId(null);
      
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

    // Clear notification after 5 seconds
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const isSystemReady = systemStatus?.pdf_loaded && systemStatus?.index_ready;

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm border-b flex-shrink-0">
        <NavBar />
      </header>

      {/* Main Content */}
      <main className="flex bg-white flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-1/5 bg-neutral-100 p-8 gap-2 flex flex-col border-r border-gray-200 flex-shrink-0">
          <button
            onClick={() => handleTabClick('chat')}
            className={`flex items-center gap-2 text-lg cursor-pointer p-3 rounded-lg transition-colors ${
              activeTab === 'chat'
                ? 'bg-blue-100 text-blue-700 font-semibold'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <GoComment className="w-6 h-6" />
            Chat
          </button>

          <button
            onClick={() => handleTabClick('chat_history')}
            className={`flex items-center gap-2 text-lg cursor-pointer p-3 rounded-lg transition-colors ${
              activeTab === 'chat_history'
                ? 'bg-blue-100 text-blue-700 font-semibold'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <GoHistory className="w-6 h-6" />
            Chat History
          </button>

          <button
            onClick={() => handleTabClick('documents')}
            className={`flex items-center gap-2 text-lg cursor-pointer p-3 rounded-lg transition-colors ${
              activeTab === 'documents'
                ? 'bg-blue-100 text-blue-700 font-semibold'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <GoFile className="w-6 h-6" />
            My Documents
          </button>

          {/* Reset System Button */}
          <div className="mt-auto">
            <button
              onClick={handleSystemReset}
              className="w-full flex items-center gap-2 text-sm p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              Reset System
            </button>
          </div>
        </aside>
        
        {/* Main Content Area */}
        <section className="flex-1 flex flex-col overflow-hidden">
          {/* Notification Bar */}
          {notification && (
            <div className="mb-4">
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
            {activeTab === 'chat' ? (
              <CombinedUploadQueryComponent 
                isSystemReady={!!isSystemReady} 
                onUploadSuccess={handleUploadSuccess}
              />
            ) : (
              activeTab === 'chat_history' ? (
                <ChatHistory 
                  onDocumentSelect={handleDocumentSelect}
                  currentDocumentId={currentDocumentId || ''}
                />
              ) : (
                <FileManager 
                  onDocumentSelect={handleDocumentSelect}
                  currentDocumentId={currentDocumentId || ''}
                />
              )
            )}
          </div>
        </section>
      </main>
    </div>
  );
}