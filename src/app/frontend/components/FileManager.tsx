'use client';
import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Trash2, 
  Calendar, 
  HardDrive, 
  AlertCircle, 
  Search,
  Filter,
  Grid,
  List,
  Star,
  Clock,
  File,
  Upload,
  MoreHorizontal,
  MessageSquare,
  Info,
  X,
} from 'lucide-react';
import { apiService, handleApiError } from '../lib/api';
import { useAuth } from '@/lib/context/AuthContext';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface DocumentInfo {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  uploadedAt: string;
  pages?: number;
  status: 'processing' | 'ready' | 'indexed' | 'uploaded' | 'temporary' | 'failed';
  starred?: boolean;
  lastAccessed?: string;
  tags?: string[];
  chatSessionsCount?: number;
  mimeType?: string;
}

interface FileManagerProps {
  onDocumentSelect?: (docId: string) => void;
  currentDocumentId?: string;
}

type SortField = 'name' | 'size' | 'uploadedAt' | 'lastAccessed' | 'pages';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

// Context Menu Component
interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onOpenInChat: () => void;
  onToggleFavorite: () => void;
  onViewDetails: () => void;
  onDelete: () => void;
  isStarred: boolean;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  position,
  onClose,
  onOpenInChat,
  onToggleFavorite,
  onViewDetails,
  onDelete,
  isStarred
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-md shadow-lg py-2 min-w-[180px]"
      style={{ left: position.x, top: position.y }}
    >
      <button
        onClick={onOpenInChat}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
      >
        <MessageSquare className="w-4 h-4" />
        Open in Chat
      </button>
      <button
        onClick={onToggleFavorite}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
      >
        <Star className={`w-4 h-4 ${isStarred ? 'fill-yellow-500 text-yellow-500' : ''}`} />
        {isStarred ? 'Remove from Favorites' : 'Add to Favorites'}
      </button>
      <button
        onClick={onViewDetails}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
      >
        <Info className="w-4 h-4" />
        View File Details
      </button>
      <div className="border-t border-gray-200 my-1"></div>
      <button
        onClick={onDelete}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </button>
    </div>
  );
};

// PDF Viewer Component
interface PDFViewerProps {
  isOpen: boolean;
  document: DocumentInfo | null;
  onClose: () => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ isOpen, document, onClose }) => {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && document) {
      loadPdfUrl();
    }
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl('');
      }
    };
  }, [isOpen, document]);

  const loadPdfUrl = async () => {
    if (!document || !user) return;

    setIsLoading(true);
    setError('');

    try {
      // Import authUtils to get the token properly
      const { authUtils } = await import('@/lib/auth');
      
      // Get the file from your API endpoint
      const response = await fetch(`/backend/api/documents/${document.id}/file`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authUtils.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load PDF file');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setError('Failed to load PDF file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center">
      <div className="bg-white rounded-lg w-2xl h-10/11 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-lg">{document.originalName}</h3>
          </div>
          <div className="flex items-center gap-2">

            <Button size="sm" variant="outline" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading PDF...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-red-600">
                <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                <p>{error}</p>
              </div>
            </div>
          )}

          {pdfUrl && !isLoading && !error && (
            <div className="flex justify-center">
              <iframe
                src={pdfUrl}
                className="border border-gray-300 rounded"
                style={{
                  width: `${zoom}%`,
                  height: '80vh',
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: 'center center'
                }}
                title={`PDF Viewer - ${document.originalName}`}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>
              Size: {(document.size / 1024 / 1024).toFixed(2)} MB
              {document.pages && ` • ${document.pages} pages`}
            </div>
            <div>
              Uploaded: {new Date(document.uploadedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// File Details Modal Component
interface FileDetailsModalProps {
  isOpen: boolean;
  document: DocumentInfo | null;
  onClose: () => void;
}

const FileDetailsModal: React.FC<FileDetailsModalProps> = ({ isOpen, document, onClose }) => {
  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-semibold">File Details</h3>
          <Button size="sm" variant="outline" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">File Name</label>
              <p className="mt-1 text-sm text-gray-900">{document.originalName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">File Size</label>
              <p className="mt-1 text-sm text-gray-900">{(document.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Upload Date</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(document.uploadedAt).toLocaleString()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <p className="mt-1 text-sm">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  document.status === 'indexed' ? 'bg-green-100 text-green-800' :
                  document.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {document.status}
                </span>
              </p>
            </div>
            {document.pages && (
              <div>
                <label className="text-sm font-medium text-gray-500">Pages</label>
                <p className="mt-1 text-sm text-gray-900">{document.pages}</p>
              </div>
            )}
            {document.chatSessionsCount !== undefined && (
              <div>
                <label className="text-sm font-medium text-gray-500">Chat Sessions</label>
                <p className="mt-1 text-sm text-gray-900">{document.chatSessionsCount}</p>
              </div>
            )}
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">File ID</label>
            <p className="mt-1 text-sm text-gray-900 font-mono">{document.id}</p>
          </div>
          
          {document.lastAccessed && (
            <div>
              <label className="text-sm font-medium text-gray-500">Last Accessed</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(document.lastAccessed).toLocaleString()}
              </p>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t bg-gray-50 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

export default function FileManager({ onDocumentSelect, currentDocumentId }: FileManagerProps) {
  const { isAuthenticated, user } = useAuth();
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>('');
  const [isClient, setIsClient] = useState(false);
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('uploadedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showStarredOnly, setShowStarredOnly] = useState(false);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    documentId: string | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    documentId: null
  });

  // Modal States
  const [pdfViewer, setPdfViewer] = useState<{
    isOpen: boolean;
    document: DocumentInfo | null;
  }>({
    isOpen: false,
    document: null
  });

  const [fileDetails, setFileDetails] = useState<{
    isOpen: boolean;
    document: DocumentInfo | null;
  }>({
    isOpen: false,
    document: null
  });

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      loadDocuments();
    }
  }, [isAuthenticated, user?.id, isClient]);

  useEffect(() => {
    filterAndSortDocuments();
  }, [documents, searchQuery, sortField, sortOrder, showStarredOnly]);

  const loadDocuments = async () => {
    if (!isClient) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Loading documents...', { isAuthenticated, userId: user?.id });
      
      if (isAuthenticated && user) {
        console.log('Loading from database...');
        const data = await apiService.getDocuments();
        console.log('Database response:', data);
        
        if (data && data.documents) {
          const formattedDocs: DocumentInfo[] = data.documents
            .filter(doc => {
              const validStatuses = ['indexed', 'ready', 'processed'];
              const isValid = validStatuses.includes(doc.status?.toLowerCase() || '');
              console.log(`Document ${doc.originalName}: status=${doc.status}, valid=${isValid}`);
              return isValid;
            })
            .map(doc => ({
              id: doc.id,
              filename: doc.filename,
              originalName: doc.originalName,
              size: doc.size,
              uploadedAt: doc.uploadedAt,
              pages: doc.pageCount,
              status: doc.status?.toLowerCase() === 'indexed' ? 'indexed' : 'ready',
              chatSessionsCount: doc.chatSessionsCount,
              mimeType: doc.mimeType,
              starred: false,
              lastAccessed: undefined
            }));
          
          console.log('Formatted documents:', formattedDocs);
          setDocuments(formattedDocs);
        } else {
          console.log('No documents found in database response');
          setDocuments([]);
        }
      } else {
        console.log('Loading from localStorage...');
        const userKey = user?.id ? `uploaded_documents_${user.id}` : 'uploaded_documents';
        const saved = localStorage.getItem(userKey);
        
        if (saved) {
          try {
            const docs = JSON.parse(saved);
            console.log('LocalStorage docs:', docs);
            
            const readyDocs = docs.filter((doc: any) => {
              const validStatuses = ['ready', 'indexed'];
              return validStatuses.includes(doc.status);
            });
            
            console.log('Ready docs from localStorage:', readyDocs);
            setDocuments(readyDocs);
          } catch (parseError) {
            console.error('Failed to parse localStorage documents:', parseError);
            setDocuments([]);
          }
        } else {
          console.log('No documents in localStorage');
          setDocuments([]);
        }
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
      setError(handleApiError(error));
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortDocuments = () => {
    let filtered = [...documents];

    if (searchQuery.trim()) {
      filtered = filtered.filter(doc => 
        doc.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (showStarredOnly) {
      filtered = filtered.filter(doc => doc.starred);
    }

    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.originalName.toLowerCase();
          bValue = b.originalName.toLowerCase();
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        case 'uploadedAt':
          aValue = new Date(a.uploadedAt).getTime();
          bValue = new Date(b.uploadedAt).getTime();
          break;
        case 'lastAccessed':
          aValue = a.lastAccessed ? new Date(a.lastAccessed).getTime() : 0;
          bValue = b.lastAccessed ? new Date(b.lastAccessed).getTime() : 0;
          break;
        case 'pages':
          aValue = a.pages || 0;
          bValue = b.pages || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredDocuments(filtered);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleDocumentClick = (doc: DocumentInfo) => {
    // Update last accessed time
    const updatedDocs = documents.map(d => 
      d.id === doc.id 
        ? { ...d, lastAccessed: new Date().toISOString() }
        : d
    );
    setDocuments(updatedDocs);
    
    // Save to appropriate storage
    if (!isAuthenticated && isClient) {
      const userKey = user?.id ? `uploaded_documents_${user.id}` : 'uploaded_documents';
      localStorage.setItem(userKey, JSON.stringify(updatedDocs));
    }
    
    // Open PDF viewer
    setPdfViewer({
      isOpen: true,
      document: doc
    });
  };

  const handleRightClick = (event: React.MouseEvent, doc: DocumentInfo) => {
    event.preventDefault();
    setContextMenu({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY },
      documentId: doc.id
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu({
      isOpen: false,
      position: { x: 0, y: 0 },
      documentId: null
    });
  };

  const getContextMenuDocument = () => {
    return documents.find(doc => doc.id === contextMenu.documentId) || null;
  };

  const handleOpenInChat = () => {
    const doc = getContextMenuDocument();
    if (doc) {
      onDocumentSelect?.(doc.id);
      handleContextMenuClose();
    }
  };

  const handleToggleFavorite = () => {
    const doc = getContextMenuDocument();
    if (doc) {
      const updatedDocs = documents.map(d => 
        d.id === doc.id 
          ? { ...d, starred: !d.starred }
          : d
      );
      setDocuments(updatedDocs);
      
      if (!isAuthenticated && isClient) {
        const userKey = user?.id ? `uploaded_documents_${user.id}` : 'uploaded_documents';
        localStorage.setItem(userKey, JSON.stringify(updatedDocs));
      }
      
      handleContextMenuClose();
    }
  };

  const handleViewDetails = () => {
    const doc = getContextMenuDocument();
    if (doc) {
      setFileDetails({
        isOpen: true,
        document: doc
      });
      handleContextMenuClose();
    }
  };

  const handleDeleteFromContext = () => {
    const doc = getContextMenuDocument();
    if (doc) {
      handleDeleteDocument(doc.id);
      handleContextMenuClose();
    }
  };

  const handleDeleteDocument = async (docId: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    
    const doc = documents.find(d => d.id === docId);
    if (!confirm(`Are you sure you want to delete "${doc?.originalName}"?`)) {
      return;
    }

    try {
      if (isAuthenticated) {
        await apiService.deleteDocument(docId);
      } else if (isClient) {
        const userKey = user?.id ? `uploaded_documents_${user.id}` : 'uploaded_documents';
        const saved = localStorage.getItem(userKey);
        if (saved) {
          const docs = JSON.parse(saved);
          const updatedDocs = docs.filter((d: DocumentInfo) => d.id !== docId);
          localStorage.setItem(userKey, JSON.stringify(updatedDocs));
        }
      }
      
      setDocuments(prev => prev.filter(d => d.id !== docId));
      
      const newSelected = new Set(selectedDocs);
      newSelected.delete(docId);
      setSelectedDocs(newSelected);

      if (docId === currentDocumentId) {
        await apiService.resetSystem();
      }
    } catch (error) {
      setError(handleApiError(error));
    }
  };

  const selectAllDocuments = () => {
    if (selectedDocs.size === filteredDocuments.length) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(filteredDocuments.map(doc => doc.id)));
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isClient || isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Documents</h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredDocuments.length} of {documents.length} documents
            {selectedDocs.size > 0 && ` • ${selectedDocs.size} selected`}
          </p>
        </div>
        <div className="flex items-center space-x-2">
 
          <div className="flex items-center text-sm text-gray-600">
            <HardDrive className="w-4 h-4 mr-1" />
            {formatFileSize(documents.reduce((total, doc) => total + doc.size, 0))}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowStarredOnly(!showStarredOnly)}
            className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
              showStarredOnly 
                ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' 
                : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Star className={`w-4 h-4 ${showStarredOnly ? 'fill-current' : ''}`} />
            Starred
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <span className="flex items-center gap-1 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer border border-gray-300 text-gray-600 hover:bg-gray-50">
                <Filter className="w-4 h-4" />
                Sort
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => handleSort('name')}>Name</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('uploadedAt')}>Upload Date</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('size')}>Size</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('pages')}>Pages</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 cursor-pointer transition-colors ${
                viewMode === 'list' 
                  ? 'bg-blue-100 text-blue-700' 
                  : ' text-gray-600 hover:bg-gray-50'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 cursor-pointer transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-blue-100 text-blue-700' 
                  : ' text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          <AlertCircle className="w-5 h-5 inline mr-2" />
          {error}
        </div>
      )}

      {/* Content */}
      {filteredDocuments.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            {documents.length === 0 ? (
              <>
                <Upload className="mx-auto w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No documents uploaded</p>
                <p className="text-sm">Upload a PDF document to get started</p>
              </>
            ) : (
              <>
                <Search className="mx-auto w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No documents found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          {viewMode === 'list' ? (
            <>
              {/* List Header */}
              <div className="grid grid-cols-12 gap-4 p-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-600 mb-4">
                <div className="col-span-1 flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedDocs.size === filteredDocuments.length && filteredDocuments.length > 0}
                    onChange={selectAllDocuments}
                    className="rounded"
                  />
                </div>
                <div className="col-span-4">Name</div>
                <div className="col-span-2">Size</div>
                <div className="col-span-3">Upload Date</div>
                <div className="col-span-1">Pages</div>
                <div className="col-span-1">Actions</div>
              </div>

              {/* List Items */}
              <div className="flex-1 overflow-y-auto space-y-2">
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className={`grid grid-cols-12 gap-4 p-4 border rounded-lg transition-colors cursor-pointer hover:bg-gray-50 ${
                      selectedDocs.has(doc.id)
                        ? 'border-blue-500 bg-blue-50'
                        : currentDocumentId === doc.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200'
                    }`}
                    onClick={() => handleDocumentClick(doc)}
                    onContextMenu={(e) => handleRightClick(e, doc)}
                  >
                    {/* Checkbox */}
                    <div className="col-span-1 flex items-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedDocs.has(doc.id)}
                        onChange={() => {
                          const newSelected = new Set(selectedDocs);
                          if (newSelected.has(doc.id)) {
                            newSelected.delete(doc.id);
                          } else {
                            newSelected.add(doc.id);
                          }
                          setSelectedDocs(newSelected);
                        }}
                        className="rounded"
                      />
                    </div>

                    {/* File Info */}
                    <div className="col-span-4 flex items-center">
                      <div className="flex items-center">
                        {doc.starred && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current mr-2" />
                        )}
                        <FileText className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{doc.originalName}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          {doc.lastAccessed && (
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatDate(doc.lastAccessed)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Size */}
                    <div className="col-span-2 flex items-center text-sm text-gray-600">
                      <File className="w-4 h-4 mr-1" />
                      {formatFileSize(doc.size)}
                    </div>

                    {/* Upload Date */}
                    <div className="col-span-3 flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(doc.uploadedAt)}
                    </div>

                    {/* Pages */}
                    <div className="col-span-1 flex items-center text-sm text-gray-600">
                      {doc.pages || 'N/A'}
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center space-x-1">
                      <button
                        onClick={(e) => handleDeleteDocument(doc.id, e)}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                        title="Delete document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Grid View */
            <div className="flex-1 overflow-y-auto px-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className={`border rounded-lg p-4 transition-all cursor-pointer hover:shadow-md ${
                      selectedDocs.has(doc.id)
                        ? 'border-blue-500 bg-blue-50'
                        : currentDocumentId === doc.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-white'
                    }`}
                    onClick={() => handleDocumentClick(doc)}
                    onContextMenu={(e) => handleRightClick(e, doc)}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedDocs.has(doc.id)}
                          onChange={() => {
                            const newSelected = new Set(selectedDocs);
                            if (newSelected.has(doc.id)) {
                              newSelected.delete(doc.id);
                            } else {
                              newSelected.add(doc.id);
                            }
                            setSelectedDocs(newSelected);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded"
                        />
                        {doc.starred && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center space-x-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button 
                              className="rounded-full p-1 hover:bg-gray-200 cursor-pointer transition-colors duration-200"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                onDocumentSelect?.(doc.id);
                              }}
                              className="cursor-pointer"
                            >
                              <MessageSquare className="w-4 h-4" />
                              Open in Chat
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                const updatedDocs = documents.map(d => 
                                  d.id === doc.id ? { ...d, starred: !d.starred } : d
                                );
                                setDocuments(updatedDocs);
                                if (!isAuthenticated && isClient) {
                                  const userKey = user?.id ? `uploaded_documents_${user.id}` : 'uploaded_documents';
                                  localStorage.setItem(userKey, JSON.stringify(updatedDocs));
                                }
                              }}
                              className="cursor-pointer"
                            >
                              <Star className={`w-4 h-4 ${doc.starred ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                              {doc.starred ? 'Remove from Favorites' : 'Add to Favorites'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                setFileDetails({ isOpen: true, document: doc });
                              }}
                              className="cursor-pointer"
                            >
                              <Info className="w-4 h-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDocument(doc.id);
                              }}
                              className="cursor-pointer text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* File Icon */}
                    <div className="flex justify-center mb-3">
                      <div className="relative">
                        <FileText className="w-12 h-12 text-red-500" />
                      </div>
                    </div>

                    {/* File Info */}
                    <div className="text-center">
                      <h3 className="font-medium text-gray-900 truncate mb-1" title={doc.originalName}>
                        {doc.originalName}
                      </h3>
                      <div className="space-y-1 text-xs text-gray-500">
                        <p>{formatFileSize(doc.size)} • {doc.pages || 'N/A'} pages</p>
                        <p>{formatDate(doc.uploadedAt)}</p>
                        {doc.chatSessionsCount !== undefined && doc.chatSessionsCount > 0 && (
                          <p className="text-blue-600">
                            <MessageSquare className="w-3 h-3 inline mr-1" />
                            {doc.chatSessionsCount} chats
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>
            Total: {documents.length} documents • {formatFileSize(documents.reduce((total, doc) => total + doc.size, 0))}
          </span>
          {selectedDocs.size > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-blue-600">
                {selectedDocs.size} document{selectedDocs.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => {
                  const selectedDocuments = filteredDocuments.filter(doc => selectedDocs.has(doc.id));
                  if (selectedDocuments.length > 0 && confirm(`Delete ${selectedDocuments.length} selected documents?`)) {
                    selectedDocuments.forEach(doc => handleDeleteDocument(doc.id));
                  }
                }}
                className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
              >
                Delete Selected
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={handleContextMenuClose}
        onOpenInChat={handleOpenInChat}
        onToggleFavorite={handleToggleFavorite}
        onViewDetails={handleViewDetails}
        onDelete={handleDeleteFromContext}
        isStarred={getContextMenuDocument()?.starred || false}
      />

      {/* PDF Viewer Modal */}
      <PDFViewer
        isOpen={pdfViewer.isOpen}
        document={pdfViewer.document}
        onClose={() => setPdfViewer({ isOpen: false, document: null })}
      />

      {/* File Details Modal */}
      <FileDetailsModal
        isOpen={fileDetails.isOpen}
        document={fileDetails.document}
        onClose={() => setFileDetails({ isOpen: false, document: null })}
      />
    </div>
  );
}