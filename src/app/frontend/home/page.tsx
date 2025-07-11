'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Brain, Zap, Link, MessageCircle } from 'lucide-react';
import UploadComponent from '../components/UploadComponent';
import QueryComponent from '../components/QueryComponent';
import StatusComponent from '../components/StatusComponent';
import { apiService, handleApiError, SystemStatus, UploadResponse } from '../lib/api';
import { GoComment, GoFile } from "react-icons/go";
import { GoGear } from "react-icons/go";
import NavBar from '../components/NavBar';

export default function Home() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Load system status on component mount
  useEffect(() => {
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
  };

  const handleSystemReset = async () => {
    if (!confirm('Are you sure you want to reset the system? This will clear all uploaded documents and indices.')) {
      return;
    }

    try {
      await apiService.resetSystem();
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
        <aside className="w-1/5 bg-neutral-100 p-8 gap-8 flex flex-col border-r border-black flex-shrink-0">
          <p className="flex items-center gap-2 text-lg">
            <GoComment className="w-6 h-6" />
            Chat
          </p>

          <p className="flex items-center gap-2 text-lg">
            <GoFile className="w-6 h-6" />
            My Documents
          </p>

  
        </aside>
        
        {/* Main Content Area */}
        <section className="flex-1 flex flex-col justify-between overflow-hidden">
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

          {/* Upload Section */}
          <div className="flex-shrink-0 p-8 pb-4">
            <UploadComponent onUploadSuccess={handleUploadSuccess} />
          </div>

          {/* Query Section - Takes remaining space */}
          <div className="px-8 pb-8 overflow-hidden bottom-0 absolute w-auto">
            <QueryComponent isSystemReady={!!isSystemReady} />
          </div>
        </section>
      </main>
    </div>
  );
}