'use client';

import React from 'react';
import { CheckCircle2, XCircle, FileText, Database, RefreshCw } from 'lucide-react';
import { SystemStatus } from '../lib/api';

interface StatusComponentProps {
  status: SystemStatus | null;
  isLoading: boolean;
  onRefresh: () => void;
  onReset: () => void;
}

export default function StatusComponent({ status, isLoading, onRefresh, onReset }: StatusComponentProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">System Status</h2>
        <div className="flex space-x-2">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={onReset}
            disabled={isLoading}
            className="flex items-center px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
          >
            Reset System
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading status...</span>
        </div>
      ) : status ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* API Status */}
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0">
              {status.status === 'running' ? (
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              ) : (
                <XCircle className="w-8 h-8 text-red-500" />
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">API Status</p>
              <p className={`text-sm ${status.status === 'running' ? 'text-green-600' : 'text-red-600'}`}>
                {status.status === 'running' ? 'Running' : 'Offline'}
              </p>
            </div>
          </div>

          {/* PDF Status */}
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0">
              {status.pdf_loaded ? (
                <FileText className="w-8 h-8 text-green-500" />
              ) : (
                <FileText className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">PDF Document</p>
              <p className={`text-sm ${status.pdf_loaded ? 'text-green-600' : 'text-gray-600'}`}>
                {status.pdf_loaded ? (status.pdf_name || 'Loaded') : 'No PDF loaded'}
              </p>
            </div>
          </div>

          {/* Index Status */}
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0">
              {status.index_ready ? (
                <Database className="w-8 h-8 text-green-500" />
              ) : (
                <Database className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">RAG Index</p>
              <p className={`text-sm ${status.index_ready ? 'text-green-600' : 'text-gray-600'}`}>
                {status.index_ready ? 'Ready' : 'Not ready'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <XCircle className="mx-auto w-12 h-12 mb-4" />
          <p>Unable to connect to the backend API</p>
          <p className="text-sm">Make sure the backend server is running on port 8000</p>
        </div>
      )}

      {/* System Ready Indicator */}
      {status && (
        <div className="mt-4 p-4 rounded-lg border-2 border-dashed">
          {status.pdf_loaded && status.index_ready ? (
            <div className="text-center text-green-700">
              <CheckCircle2 className="mx-auto w-8 h-8 mb-2" />
              <p className="font-medium">System Ready!</p>
              <p className="text-sm">You can now query your documents</p>
            </div>
          ) : (
            <div className="text-center text-yellow-700">
              <div className="mx-auto w-8 h-8 mb-2 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="font-medium">System Not Ready</p>
              <p className="text-sm">
                {!status.pdf_loaded 
                  ? 'Please upload a PDF document first' 
                  : 'Processing document...'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}