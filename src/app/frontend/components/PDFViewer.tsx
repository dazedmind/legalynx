// src/app/frontend/components/PDFViewer.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  FileText, 
  AlertCircle,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Home,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/context/AuthContext';
import { authUtils } from '@/lib/auth';

interface DocumentInfo {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  uploadedAt: string;
  pages?: number;
  status?: string;
  mimeType?: string;
}

interface PDFViewerProps {
  isOpen: boolean;
  document: DocumentInfo | null;
  onClose: () => void;
  onOpenInChat?: (documentId: string) => void;
  className?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ 
  isOpen, 
  document, 
  onClose, 
  onOpenInChat,
  className = "" 
}) => {
  const { user } = useAuth();
  
  // PDF loading states
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [useDirectUrl, setUseDirectUrl] = useState(false);
  
  // PDF viewer controls
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Refs
  const viewerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (isOpen && document) {
      loadPdfUrl();
      // Reset viewer state when opening new document
      setZoom(100);
      setRotation(0);
      setCurrentPage(1);
      setIsFullscreen(false);
      setUseDirectUrl(false);
    }
    
    // Cleanup blob URL when component unmounts or document changes
    return () => {
      if (pdfUrl && pdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl('');
      }
    };
  }, [isOpen, document]);

  // Handle escape key to close viewer
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.document.addEventListener('keydown', handleEscape);
      return () => window.document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const loadPdfUrl = async () => {
    if (!document || !user) {
      setError('Authentication required to view document');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Try the direct API endpoint first
      const directUrl = `/backend/api/documents/${document.id}/file`;
      
      // Test if the direct URL works
      const testResponse = await fetch(directUrl, {
        method: 'HEAD', // Just check if the endpoint exists
        headers: {
          'Authorization': `Bearer ${authUtils.getToken()}`,
        },
      });

      if (testResponse.ok) {
        // Use direct URL - this bypasses blob URL issues
        setPdfUrl(directUrl);
        setUseDirectUrl(true);
      } else {
        // Fallback to blob URL method
        await loadPdfAsBlob();
      }
    } catch (error) {
      console.error('Error loading PDF:', error);
      setError(error instanceof Error ? error.message : 'Failed to load PDF file');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPdfAsBlob = async () => {
    if (!document || !user) return;

    try {
      const response = await fetch(`/backend/api/documents/${document.id}/file`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authUtils.getToken()}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Document file not found');
        } else if (response.status === 403) {
          throw new Error('Access denied to this document');
        } else {
          throw new Error(`Failed to load PDF: ${response.statusText}`);
        }
      }

      const blob = await response.blob();
      
      // Verify it's a PDF
      if (blob.type !== 'application/pdf') {
        throw new Error('Invalid file type. Expected PDF.');
      }

      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setUseDirectUrl(false);
    } catch (error) {
      throw error;
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 25));
  };

  const handleZoomReset = () => {
    setZoom(100);
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleFullscreen = () => {
    if (!isFullscreen && viewerRef.current) {
      if (viewerRef.current.requestFullscreen) {
        viewerRef.current.requestFullscreen();
      }
    } else {
      if (window.document.exitFullscreen) {
        window.document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleDownload = async () => {
    if (!document) return;

    try {
      // For direct URL, trigger download differently
      if (useDirectUrl) {
        const link = window.document.createElement('a');
        link.href = `/backend/api/documents/${document.id}/file?download=true`;
        link.download = document.originalName;
        link.target = '_blank';
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      } else if (pdfUrl) {
        // For blob URL
        const link = window.document.createElement('a');
        link.href = pdfUrl;
        link.download = document.originalName;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleRefresh = () => {
    if (pdfUrl && pdfUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl('');
    }
    loadPdfUrl();
  };

  const handleOpenInChat = () => {
    if (document && onOpenInChat) {
      onOpenInChat(document.id);
      onClose();
    }
  };

  const handleOpenInNewTab = () => {
    if (pdfUrl && document) {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${document.originalName}</title>
              <style>
                body { margin: 0; padding: 0; }
                embed { width: 100vw; height: 100vh; }
              </style>
            </head>
            <body>
              <embed src="${pdfUrl}" type="application/pdf" width="100%" height="100%">
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen || !document) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center ${className}`}
      onClick={(e) => {
        // Close when clicking backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        ref={viewerRef}
        className={`bg-white rounded-lg flex flex-col transition-all duration-200 ${
          isFullscreen 
            ? 'w-full h-full rounded-none' 
            : 'w-11/12 h-5/6 max-w-7xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <FileText className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-lg truncate" title={document.originalName}>
                {document.originalName}
              </h3>
              <p className="text-sm text-gray-600">
                {formatFileSize(document.size)}
                {document.pages && ` • ${document.pages} pages`}
                {document.status && (
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    document.status === 'indexed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {document.status}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 px-2 py-1 bg-white rounded border">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleZoomOut} 
                disabled={zoom <= 25}
                className="h-8 w-8 p-0"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[50px] text-center">
                {zoom}%
              </span>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleZoomIn} 
                disabled={zoom >= 300}
                className="h-8 w-8 p-0"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleZoomReset}
                className="h-8 w-8 p-0"
                title="Reset zoom"
              >
                <Home className="w-4 h-4" />
              </Button>
            </div>

            {/* Action Controls */}
            <div className="flex items-center gap-1">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleOpenInNewTab}
                className="h-8 w-8 p-0"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>

              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleRefresh}
                className="h-8 w-8 p-0"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>

              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleDownload}
                disabled={!pdfUrl}
                className="h-8 w-8 p-0"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </Button>

              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleFullscreen}
                className="h-8 w-8 p-0"
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>

              {onOpenInChat && (
                <Button 
                  size="sm" 
                  variant="default"
                  onClick={handleOpenInChat}
                  className="h-8 px-3"
                >
                  Open in Chat
                </Button>
              )}

              <Button 
                size="sm" 
                variant="outline" 
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg">Loading PDF...</p>
                <p className="text-gray-500 text-sm mt-2">Please wait while we fetch your document</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                <h3 className="text-lg font-semibold text-red-700 mb-2">Failed to Load PDF</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleRefresh} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <Button onClick={handleOpenInNewTab} variant="outline">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in New Tab
                  </Button>
                  <Button onClick={onClose} variant="default">
                    Close
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Having trouble? Try opening in a new tab or check your browser's privacy settings.
                </p>
              </div>
            </div>
          )}

          {pdfUrl && !isLoading && !error && (
            <div className="h-full p-4 overflow-auto">
              <div className="flex justify-center min-h-full">
                {useDirectUrl ? (
                  // Direct URL approach - better for Brave
                  <object
                    data={pdfUrl}
                    type="application/pdf"
                    className="border border-gray-300 rounded shadow-lg bg-white"
                    style={{
                      width: `${zoom}%`,
                      minWidth: '800px',
                      height: '100%',
                      minHeight: '600px',
                      transform: `rotate(${rotation}deg)`,
                      transformOrigin: 'center center'
                    }}
                  >
                    <p className="text-center p-8">
                      Your browser doesn't support embedded PDFs. 
                      <Button onClick={handleOpenInNewTab} variant="link" className="ml-2">
                        Click here to open in a new tab
                      </Button>
                    </p>
                  </object>
                ) : (
                  // Fallback iframe approach
                  <iframe
                    ref={iframeRef}
                    src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                    className="border border-gray-300 rounded shadow-lg bg-white"
                    style={{
                      width: `${zoom}%`,
                      minWidth: '800px',
                      height: '100%',
                      minHeight: '600px',
                      transform: `rotate(${rotation}deg)`,
                      transformOrigin: 'center center'
                    }}
                    title={`PDF Viewer - ${document.originalName}`}
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
                    allow="fullscreen"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t bg-gray-50 rounded-b-lg">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span>
                Uploaded: {new Date(document.uploadedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              {document.mimeType && (
                <span>Type: {document.mimeType}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span>ID: {document.id.slice(-8)}</span>
              {error && (
                <Button onClick={handleOpenInNewTab} size="sm" variant="outline">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Open Externally
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;