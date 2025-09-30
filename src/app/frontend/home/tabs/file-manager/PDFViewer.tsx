// src/app/frontend/components/PDFViewer.tsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  ExternalLink,
  FileText,
  AlertCircle,
  Maximize,
  Minimize
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/context/AuthContext';
import { authUtils } from '@/lib/auth';

interface DocumentInfo {
  id: string;
  fileName: string;
  originalFileName: string;
  size: number;
  uploadedAt: string;
  pages?: number;
  status: string;
  mimeType?: string;
}

interface PDFViewerProps {
  isOpen: boolean;
  document: DocumentInfo | null;
  onClose: () => void;
  onOpenInChat?: (documentId: string) => void;
  className?: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ 
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
  
  // Refs
  const viewerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (isOpen && document) {
      loadPdfUrl();
      // Reset viewer state when opening new document
      setZoom(100);
      setRotation(0);
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
      // Get token directly from authUtils
      const token = authUtils.getToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      console.log('🔍 Loading PDF for document:', document.id);
      
      // Try the direct API endpoint first
      const directUrl = `/backend/api/documents/${document.id}/file`;
      
      // Test if the direct URL works
      const testResponse = await fetch(directUrl, {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 PDF test response:', testResponse.status, testResponse.statusText);

      if (testResponse.ok) {
        // Use direct URL with token in URL for iframe compatibility
        const urlWithAuth = `${directUrl}?token=${encodeURIComponent(token)}`;
        setPdfUrl(urlWithAuth);
        setUseDirectUrl(true);
        console.log('✅ Using direct URL for PDF');
      } else {
        // Fallback to blob URL method
        console.log('⚠️ Direct URL failed, trying blob method');
        await loadPdfAsBlob();
      }
    } catch (error) {
      console.error('❌ Error loading PDF:', error);
      setError(error instanceof Error ? error.message : 'Failed to load PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPdfAsBlob = async () => {
    try {
      const token = authUtils.getToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      console.log('📥 Fetching PDF as blob...');
      
      const response = await fetch(`/backend/api/documents/${document!.id}/file`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 PDF blob response:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ PDF fetch error:', errorData);
        
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (response.status === 404) {
          throw new Error('Document file not found');
        } else if (response.status === 403) {
          throw new Error('Access denied to this document');
        } else {
          throw new Error(errorData.error || `Failed to load PDF: ${response.statusText}`);
        }
      }

      const blob = await response.blob();
      console.log('📦 PDF blob size:', blob.size, 'type:', blob.type);
      
      // Verify it's a PDF
      if (!blob.type.includes('pdf') && blob.size > 0) {
        console.warn('⚠️ Unexpected blob type:', blob.type);
      }

      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setUseDirectUrl(false);
      console.log('✅ PDF blob URL created');
    } catch (error) {
      console.error('❌ Blob loading error:', error);
      throw error;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFullscreen = () => setIsFullscreen(!isFullscreen);

  const handleDownload = () => {
    if (pdfUrl) {
      const link = window.document.createElement('a');
      link.href = pdfUrl;
      link.download = document?.originalFileName || 'document.pdf';
      link.click();
    }
  };

  const handleOpenInChat = () => {
    if (document && onOpenInChat) {
      onOpenInChat(document.id);
      onClose();
    }
  };

  if (!isOpen || !document) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center pdf-viewer-backdrop ${className}`}>
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      <div 
        ref={viewerRef}
        className={`relative bg-primary border border-tertiary rounded-lg shadow-xl overflow-hidden ${
          isFullscreen 
            ? 'w-full h-full rounded-none' 
            : 'w-2xl h-fit'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-tertiary rounded-t-lg">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <FileText className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-lg truncate text-foreground" title={document.fileName}>
                {document.fileName}
              </h3>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
      
            {/* Action Controls */}
            <div className="flex items-center gap-1">
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
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </Button>

              {onOpenInChat && (
                <Button 
                  size="sm" 
                  onClick={handleOpenInChat}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Open in Chat
                </Button>
              )}

              <Button 
                size="sm" 
                variant="outline" 
                onClick={onClose}
                className="h-8 w-8 p-0"
                title="Close"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-auto bg-gray-100">
          {isLoading && (
            <div className="flex items-center justify-center h-full my-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading PDF...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-destructive">
                <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                <p className="font-medium mb-2">Failed to load PDF</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          )}

          {pdfUrl && !isLoading && !error && (
            <div className="flex justify-center p-4">
              {useDirectUrl ? (
                // For direct URL, embed with token parameter
                <iframe
                  ref={iframeRef}
                  src={pdfUrl}
                  className="border border-gray-300 rounded shadow-lg"
                  style={{
                    width: `${zoom}%`,
                    height: isFullscreen ? 'calc(100vh - 120px)' : '70vh',
                    transform: `rotate(${rotation}deg)`,
                    transformOrigin: 'center center',
                    minWidth: '300px',
                    minHeight: '400px'
                  }}
                  title={`PDF Viewer - ${document.fileName}`}
                  onLoad={() => setIsLoading(false)}
                />
              ) : (
                // For blob URL, use object element which handles PDFs better
                <object
                  data={pdfUrl}
                  type="application/pdf"
                  className="border border-gray-300 rounded shadow-lg"
                  style={{
                    width: `${zoom}%`,
                    height: isFullscreen ? 'calc(100vh - 120px)' : '70vh',
                    transform: `rotate(${rotation}deg)`,
                    transformOrigin: 'center center',
                    minWidth: '300px',
                    minHeight: '400px'
                  }}
                >
                  <p className="text-center text-muted-foreground">
                    Your browser doesn't support PDF viewing. 
                    <button onClick={handleDownload} className="text-blue-600 hover:underline ml-1">
                      Download the PDF
                    </button>
                  </p>
                </object>
              )}
            </div>
          )}
        </div>


      </div>
    </div>
  );
};