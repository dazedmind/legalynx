'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Brain, Zap } from 'lucide-react';
import UploadComponent from './frontend/components/UploadComponent';
import QueryComponent from './frontend/components/QueryComponent';
import StatusComponent from './frontend/components/StatusComponent';
import { apiService, handleApiError, SystemStatus, UploadResponse } from './frontend/lib/api';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">RAG Pipeline</h1>
                <p className="text-sm text-gray-600">Document Analysis & Question Answering</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-1" />
                  PDF Processing
                </div>
                <div className="flex items-center">
                  <Zap className="w-4 h-4 mr-1" />
                  AI-Powered Q&A
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notification */}
        {notification && (
          <div
            className={`mb-6 p-4 rounded-md border ${
              notification.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {notification.message}
          </div>
        )}

        {/* Status Component */}
        <StatusComponent
          status={systemStatus}
          isLoading={isLoadingStatus}
          onRefresh={loadSystemStatus}
          onReset={handleSystemReset}
        />

        {/* Upload Component */}
        <UploadComponent onUploadSuccess={handleUploadSuccess} />

        {/* Query Component */}
        <QueryComponent isSystemReady={!!isSystemReady} />

        {/* Features Info */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Smart PDF Processing</h4>
              <p className="text-sm text-gray-600">
                Automatically detects document type and applies OCR for scanned PDFs or direct text extraction for structured documents.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Brain className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Hybrid Retrieval</h4>
              <p className="text-sm text-gray-600">
                Combines vector search, keyword matching (BM25), and semantic chunking for optimal information retrieval.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Advanced Analysis</h4>
              <p className="text-sm text-gray-600">
                Query analysis, reranking demonstration, and detailed source attribution for transparent AI responses.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>RAG Pipeline - Powered by LlamaIndex, Google Gemini & Next.js</p>
            <p className="mt-1">
              Upload a PDF document to get started with intelligent document analysis
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}