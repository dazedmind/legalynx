// src/app/frontend/components/UploadProgress.tsx
import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Loader2, Upload, Cloud, Brain } from 'lucide-react';

interface UploadProgressProps {
  documentId: string;
  onComplete?: (document: any) => void;
  onError?: (error: string) => void;
}

interface DocumentStatus {
  document: {
    id: string;
    originalName: string;
    size: number;
    status: string;
    pageCount?: number;
    uploadedAt: string;
    updatedAt: string;
    hasS3Storage: boolean;
    s3Url?: string;
  };
  progress: {
    percentage: number;
    stage: string;
    message: string;
    canDownload: boolean;
    inCloudStorage: boolean;
  };
  timing: {
    uploadedAt: string;
    lastUpdated: string;
    processingTimeSeconds: number;
    isRecent: boolean;
  };
}

export default function UploadProgress({ documentId, onComplete, onError }: UploadProgressProps) {
  const [status, setStatus] = useState<DocumentStatus | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!documentId) return;

    const pollStatus = async () => {
      try {
        // Import authUtils to get token from cookies
        const { authUtils } = await import('@/lib/auth');
        const token = authUtils.getToken();
        
        if (!token) {
          console.warn('No auth token found, stopping polling');
          setIsPolling(false);
          setError('Authentication required');
          return;
        }

        console.log('Polling status for document:', documentId);
        console.log('Using token length:', token.length);

        const response = await fetch(`/backend/api/documents/status/${documentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Status response status:', response.status);

        if (response.status === 401) {
          setError('Authentication failed. Please sign in again.');
          setIsPolling(false);
          onError?.('Authentication failed');
          return;
        }

        if (response.status === 404) {
          setError('Document not found');
          setIsPolling(false);
          onError?.('Document not found');
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const statusData = await response.json();
        console.log('Status data received:', {
          stage: statusData.progress?.stage,
          percentage: statusData.progress?.percentage
        });
        
        setStatus(statusData);

        // Stop polling when complete or failed - UPDATED to include TEMPORARY
        if (statusData.progress.stage === 'completed' || 
            statusData.progress.stage === 'failed' ||
            statusData.document.status === 'TEMPORARY') {
          
          console.log('🛑 Stopping polling - status:', statusData.document.status);
          setIsPolling(false);
          
          if (statusData.progress.stage === 'completed' || statusData.document.status === 'TEMPORARY') {
            onComplete?.(statusData.document);
          } else {
            onError?.(statusData.progress.message);
          }
        }

      } catch (err) {
        console.error('Status polling error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setIsPolling(false);
        onError?.(errorMessage);
      }
    };

    // Initial status check
    pollStatus();

    // Set up polling interval
    let interval: NodeJS.Timeout;
    if (isPolling) {
      interval = setInterval(pollStatus, 2000); // Poll every 2 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [documentId, isPolling, onComplete, onError]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-800">Error: {error}</span>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-center">
          <Loader2 className="w-5 h-5 text-blue-600 mr-2 animate-spin" />
          <span className="text-blue-800">Checking document status...</span>
        </div>
      </div>
    );
  }

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'uploaded':
        return <Upload className="w-5 h-5 text-blue-600" />;
      case 'processing':
        return <Brain className="w-5 h-5 text-purple-600 animate-pulse" />;
      case 'processed':
        return <Cloud className="w-5 h-5 text-indigo-600" />;
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'uploaded':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'processing':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'processed':
        return 'bg-indigo-50 border-indigo-200 text-indigo-800';
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'failed':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className={`p-4 border rounded-md ${getStageColor(status.progress.stage)}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          {getStageIcon(status.progress.stage)}
          <span className="ml-2 font-medium">{status.document.originalName}</span>
        </div>
        <span className="text-sm">
          {formatFileSize(status.document.size)}
          {status.document.pageCount && ` • ${status.document.pageCount} pages`}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span>{status.progress.message}</span>
          <span>{status.progress.percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              status.progress.stage === 'failed' 
                ? 'bg-red-500' 
                : status.progress.stage === 'completed'
                ? 'bg-green-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${status.progress.percentage}%` }}
          />
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-between text-xs mb-3">
        <div className={`flex items-center ${status.progress.percentage >= 25 ? 'text-current' : 'text-gray-400'}`}>
          <div className={`w-2 h-2 rounded-full mr-1 ${status.progress.percentage >= 25 ? 'bg-current' : 'bg-gray-300'}`} />
          Uploaded
        </div>
        <div className={`flex items-center ${status.progress.percentage >= 50 ? 'text-current' : 'text-gray-400'}`}>
          <div className={`w-2 h-2 rounded-full mr-1 ${status.progress.percentage >= 50 ? 'bg-current' : 'bg-gray-300'}`} />
          Processing
        </div>
        <div className={`flex items-center ${status.progress.percentage >= 75 ? 'text-current' : 'text-gray-400'}`}>
          <div className={`w-2 h-2 rounded-full mr-1 ${status.progress.percentage >= 75 ? 'bg-current' : 'bg-gray-300'}`} />
          Saving
        </div>
        <div className={`flex items-center ${status.progress.percentage >= 100 ? 'text-current' : 'text-gray-400'}`}>
          <div className={`w-2 h-2 rounded-full mr-1 ${status.progress.percentage >= 100 ? 'bg-current' : 'bg-gray-300'}`} />
          Complete
        </div>
      </div>

      {/* Additional Info */}
      <div className="flex justify-between text-xs opacity-75">
        <span>
          {status.timing.isRecent 
            ? `Processing time: ${status.timing.processingTimeSeconds}s`
            : `Uploaded: ${new Date(status.timing.uploadedAt).toLocaleString()}`
          }
        </span>
        {status.progress.inCloudStorage && (
          <span className="flex items-center">
            <Cloud className="w-3 h-3 mr-1" />
            Stored in cloud
          </span>
        )}
      </div>

      {/* Action Buttons */}
      {status.progress.stage === 'completed' && (
        <div className="mt-3 pt-3 border-t border-current border-opacity-20">
          <div className="flex gap-2">
            <button
              onClick={() => onComplete?.(status.document)}
              className="px-3 py-1 bg-current text-white rounded text-sm hover:opacity-90 transition-opacity"
            >
              Start Chatting
            </button>
            {status.progress.canDownload && (
              <button className="px-3 py-1 border border-current rounded text-sm hover:bg-current hover:text-white transition-colors">
                Download
              </button>
            )}
          </div>
        </div>
      )}

      {status.progress.stage === 'failed' && (
        <div className="mt-3 pt-3 border-t border-current border-opacity-20">
          <button className="px-3 py-1 bg-current text-white rounded text-sm hover:opacity-90 transition-opacity">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

// Helper function
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}