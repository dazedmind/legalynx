
'use client';
import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Upload,
  Search,
  FolderPlus,
  ArrowLeft,
  MessageSquare,
  Info,
  Trash2,
  Folder,
  FileText,
  Move,
  Eye,
  Edit
} from 'lucide-react';
import { apiService, handleApiError } from '../../../../lib/api';
import { useAuth } from '@/lib/context/AuthContext';
import { useTheme } from 'next-themes';
import { CreateFolderModal } from './CreateFolderModal';
import { FolderNavigation } from './FolderNavigation';
import { FileManagerToolbar } from './FileManagerToolbar';
import { FileGrid } from './FileGrid';
import { PDFViewer } from './PDFViewer';
import { FileDetailsModal } from './FileDetailsModal';
import { DeleteFolderModal } from './DeleteFolderModal';
import { RenameModal } from './RenameModal';
import { authUtils } from '@/lib/auth';

interface DocumentInfo {
  id: string;
  fileName: string;
  originalFileName: string;
  size: number;
  uploadedAt: string;
  pages?: number;
  status: 'PROCESSING' | 'READY' | 'INDEXED' | 'UPLOADED' | 'TEMPORARY' | 'FAILED';
  starred?: boolean;
  lastAccessed?: string;
  tags?: string[];
  chatSessionsCount?: number;
  mimeType?: string;
}

interface FolderInfo {
  id: string;
  name: string;
  path: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  document_count?: number;
  subfolder_count?: number;
}

interface FileManagerProps {
  onDocumentSelect?: (docId: string) => void;
  currentDocumentId?: string;
  onDocumentDeleted?: (docId: string) => void;
}

type SortField = 'name' | 'size' | 'uploadedAt' | 'lastAccessed' | 'pages';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

// Move To Modal Component
interface MoveToModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMove: (targetFolderId: string | null) => void;
  folders: FolderInfo[];
  currentFolderId: string | null;
  selectedDocuments: DocumentInfo[];
}

const MoveToModal: React.FC<MoveToModalProps> = ({
  isOpen,
  onClose,
  onMove,
  folders,
  currentFolderId,
  selectedDocuments
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  const handleMove = async () => {
    setIsMoving(true);
    try {
      await onMove(selectedFolderId);
      onClose();
    } catch (error) {
      console.error('Move failed:', error);
    } finally {
      setIsMoving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-primary rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-tertiary">
          <h2 className="text-lg font-semibold text-foreground">
            Move {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Select destination folder
          </p>
        </div>
        
        <div className="p-4 max-h-64 overflow-y-auto">
          {/* Root folder option */}
          <div 
            className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
              selectedFolderId === null ? 'bg-blue-50 border-2 border-blue-500' : 'hover:bg-accent'
            }`}
            onClick={() => setSelectedFolderId(null)}
          >
            <Folder className="w-5 h-5 text-blue-500 mr-3" />
            <span className="text-foreground">Root Folder</span>
            {currentFolderId === null && (
              <span className="ml-auto text-xs text-muted-foreground">(current)</span>
            )}
          </div>

          {/* Available folders */}
          {folders.map((folder) => (
            <div
              key={folder.id}
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                selectedFolderId === folder.id ? 'bg-blue-50 border-2 border-blue-500' : 'hover:bg-accent'
              } ${folder.id === currentFolderId ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => {
                if (folder.id !== currentFolderId) {
                  setSelectedFolderId(folder.id);
                }
              }}
            >
              <Folder className="w-5 h-5 text-blue-500 mr-3" />
              <div className="flex-1">
                <span className="text-foreground">{folder.name}</span>
                {folder.id === currentFolderId && (
                  <span className="ml-2 text-xs text-muted-foreground">(current)</span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {folder.document_count || 0} docs
              </span>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-tertiary flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            disabled={isMoving}
          >
            Cancel
          </button>
          <button
            onClick={handleMove}
            disabled={isMoving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isMoving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Move Here
          </button>
        </div>
      </div>
    </div>
  );
};

export default function FileManager({ onDocumentSelect, currentDocumentId, onDocumentDeleted }: FileManagerProps) {
  const { isAuthenticated, user } = useAuth();
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [folders, setFolders] = useState<FolderInfo[]>([]);
  const [allFolders, setAllFolders] = useState<FolderInfo[]>([]); // For move-to modal
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentInfo[]>([]);
  const [filteredFolders, setFilteredFolders] = useState<FolderInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>('');
  const [isClient, setIsClient] = useState(false);

  // Folder navigation
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([]);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);

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
    folderId: string | null;
    isFolder: boolean;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    documentId: null,
    folderId: null,
    isFolder: false
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
    folder: FolderInfo | null;
  }>({
    isOpen: false,
    document: null,
    folder: null
  });

  const [deleteFolderModal, setDeleteFolderModal] = useState<{
    isOpen: boolean;
    folder: any | null;
  }>({
    isOpen: false,
    folder: null
  });

  const [moveToModal, setMoveToModal] = useState<{
    isOpen: boolean;
    selectedDocuments: DocumentInfo[];
  }>({
    isOpen: false,
    selectedDocuments: []
  });

  const [renameModal, setRenameModal] = useState<{
    isOpen: boolean;
    item: DocumentInfo | FolderInfo | null;
    itemType: 'document' | 'folder';
  }>({
    isOpen: false,
    item: null,
    itemType: 'document'
  });

  useEffect(() => {
    setIsClient(true);
    if (isAuthenticated) {
      loadFolderContents(currentFolderId);
      loadAllFolders(); // Load all folders for move-to modal
    }
  }, [isAuthenticated, currentFolderId]);

  const loadFolderContents = async (folderId: string | null) => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError('');

    try {
      const token = authUtils.getToken();
      const response = await fetch(`/backend/api/folders?parentId=${folderId || ''}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Folders API not found, loading documents only');
          await loadDocumentsOnly();
          return;
        }
        throw new Error('Failed to load folder contents');
      }

      const data = await response.json();
      setFolders(data.folders || []);
      setDocuments(data.documents || []);
      setBreadcrumbs(data.breadcrumbs || []);
    } catch (err) {
      console.warn('Folder API failed, falling back to documents only');
      await loadDocumentsOnly();
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllFolders = async () => {
    if (!isAuthenticated) return;

    try {
      const token = authUtils.getToken();
      const response = await fetch('/backend/api/folders/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAllFolders(data.folders || []);
      }
    } catch (err) {
      console.warn('Could not load all folders for move-to modal');
    }
  };

  const loadDocumentsOnly = async () => {
    try {
      const response = await apiService.getDocuments();
      setDocuments(response.documents.map((doc: any) => ({
        ...doc,
        size: doc.fileSize || 0,
        pages: doc.pageCount || 0,
        status: doc.status
      })) || []);
      setFolders([]);
      setBreadcrumbs([]);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      console.error('Load documents error:', err);
    }
  };

  const createFolder = async (name: string) => {
    if (!isAuthenticated) return;

    try {
      const token = authUtils.getToken();
      const response = await fetch('/backend/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          parentId: currentFolderId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create folder');
      }

      await loadFolderContents(currentFolderId);
      await loadAllFolders(); // Refresh all folders list
    } catch (err) {
      throw err;
    }
  };

  const handleBulkDelete = async (docId: string, folderId:string, force: boolean = false) => {
    if (!isAuthenticated) return;

    try {
      const response = await apiService.bulkDeleteDocuments([docId, folderId]);
      if (response.message) {
        setDocuments(prev => prev.filter(doc => doc.id !== docId));
        if (onDocumentDeleted) {
          onDocumentDeleted(docId);
        }
      } else {
        throw new Error('Failed to delete documents');
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      console.error('Bulk delete error:', err);
      throw err;
    }
  }

  const deleteFolder = async (folderId: string, force: boolean = false) => {
    if (!isAuthenticated) return;

    try {
      const token = authUtils.getToken();
      const url = `/backend/api/folders/${folderId}${force ? '?force=true' : ''}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.status === 409 && data.requiresConfirmation) {
        setDeleteFolderModal({
          isOpen: true,
          folder: data.folder
        });
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete folder');
      }

      await loadFolderContents(currentFolderId);
      await loadAllFolders();
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      console.error('Delete folder error:', err);
    }
  };

  const renameDocument = async (documentId: string, newName: string) => {
    if (!isAuthenticated) return;

    try {
      const token = authUtils.getToken();
      const response = await fetch(`/backend/api/documents/${documentId}/rename`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newName })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to rename document');
      }

      const result = await response.json();
      console.log('✅ Document renamed:', result);

      // Update documents in state
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, originalFileName: result.document.originalFileName }
          : doc
      ));

    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      console.error('Rename document error:', err);
      throw err;
    }
  };

  const renameFolder = async (folderId: string, newName: string) => {
    if (!isAuthenticated) return;

    try {
      const token = authUtils.getToken();
      const response = await fetch(`/backend/api/folders/${folderId}/rename`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newName })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to rename folder');
      }

      const result = await response.json();
      console.log('✅ Folder renamed:', result);

      // Update folders in state
      setFolders(prev => prev.map(folder => 
        folder.id === folderId 
          ? { ...folder, name: result.folder.name, path: result.folder.path }
          : folder
      ));

      // Also update allFolders for move-to modal
      setAllFolders(prev => prev.map(folder => 
        folder.id === folderId 
          ? { ...folder, name: result.folder.name, path: result.folder.path }
          : folder
      ));

    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      console.error('Rename folder error:', err);
      throw err;
    }
  };

  const handleDeleteFolderConfirm = async (force: boolean) => {
    if (!deleteFolderModal.folder) return;
    
    await deleteFolder(deleteFolderModal.folder.id, force);
    setDeleteFolderModal({ isOpen: false, folder: null });
  };

  const moveDocuments = async (documentIds: string[], targetFolderId: string | null) => {
    if (!isAuthenticated) return;

    try {
      const token = authUtils.getToken();
      const response = await fetch('/backend/api/documents/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          documentIds,
          targetFolderId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to move documents');
      }

      const result = await response.json();
      console.log('✅ Documents moved:', result);

      await loadFolderContents(currentFolderId);
      setSelectedDocs(new Set());

    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      console.error('Move documents error:', err);
    }
  };

  const deleteDocument = async (docId: string) => {
    try {
      const response = await apiService.deleteDocument(docId);
      
      if (response.message) {
        setDocuments(prev => prev.filter(doc => doc.id !== docId));
        if (onDocumentDeleted) {
          onDocumentDeleted(docId);
        }
      } else {
        throw new Error('Failed to delete document');
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    }
  };

  const navigateToFolder = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setSearchQuery('');
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleDocumentContextMenu = (e: React.MouseEvent, docId: string) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      documentId: docId,
      folderId: null,
      isFolder: false
    });
  };

  const handleFolderContextMenu = (e: React.MouseEvent, folderId: string) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      documentId: null,
      folderId: folderId,
      isFolder: true
    });
  };

  const toggleDocumentSelection = (docId: string) => {
    const newSelected = new Set(selectedDocs);
    if (newSelected.has(docId)) {
      newSelected.delete(docId);
    } else {
      newSelected.add(docId);
    }
    setSelectedDocs(newSelected);
  };

  const selectAllDocuments = () => {
    if (selectedDocs.size === filteredDocuments.length) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(filteredDocuments.map(doc => doc.id)));
    }
  };

  // Enhanced document click handler to open PDF viewer
  const handleDocumentClick = (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (doc) {
      // Update last accessed time
      const updatedDocs = documents.map(d => 
        d.id === docId 
          ? { ...d, lastAccessed: new Date().toISOString() }
          : d
      );
      setDocuments(updatedDocs);
      
      // Open PDF viewer
      setPdfViewer({ isOpen: true, document: doc });
    }
  };

  const handleMoveToClick = () => {
    const selectedDocuments = documents.filter(doc => selectedDocs.has(doc.id));
    setMoveToModal({
      isOpen: true,
      selectedDocuments
    });
  };

  const handleMoveDocuments = async (targetFolderId: string | null) => {
    let documentIds: string[];
    
    // If we have documents in the modal, use those IDs
    if (moveToModal.selectedDocuments && moveToModal.selectedDocuments.length > 0) {
      documentIds = moveToModal.selectedDocuments.map(doc => doc.id);
    } else {
      // Otherwise use selected documents
      documentIds = Array.from(selectedDocs);
    }
    
    if (documentIds.length === 0) {
      console.error('No documents selected for move');
      return;
    }
    
    console.log('Moving documents:', documentIds, 'to folder:', targetFolderId);
    await moveDocuments(documentIds, targetFolderId);
  };

  const handleShowMoveToModal = (documents: DocumentInfo[]) => {
    console.log('Showing move to modal for documents:', documents.map(d => d.originalFileName));
    setMoveToModal({
      isOpen: true,
      selectedDocuments: documents
    });
  };

  const handleRename = async (newName: string) => {
    if (!renameModal.item) return;

    if (renameModal.itemType === 'document') {
      await renameDocument(renameModal.item.id, newName);
    } else {
      await renameFolder(renameModal.item.id, newName);
    }
  };

  const handleShowRenameModal = (item: DocumentInfo | FolderInfo, itemType: 'document' | 'folder') => {
    console.log('Showing rename modal for:', itemType, item);
    setRenameModal({
      isOpen: true,
      item,
      itemType
    });
  };

  // Filter and sort logic
  useEffect(() => {
    let filtered = [...documents];
    let filteredFolderList = [...folders];

    // Filter to show only INDEXED documents
    filtered = filtered.filter(doc => doc.status === 'INDEXED');

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.originalFileName.toLowerCase().includes(query) ||
        doc.fileName.toLowerCase().includes(query)
      );
      filteredFolderList = filteredFolderList.filter(folder =>
        folder.name.toLowerCase().includes(query)
      );
    }

    if (showStarredOnly) {
      filtered = filtered.filter(doc => doc.starred);
    }

    // Sort documents
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      switch (sortField) {
        case 'name':
          aValue = a.originalFileName.toLowerCase();
          bValue = b.originalFileName.toLowerCase();
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        case 'uploadedAt':
          aValue = new Date(a.uploadedAt).getTime();
          bValue = new Date(b.uploadedAt).getTime();
          break;
        case 'pages':
          aValue = a.pages || 0;
          bValue = b.pages || 0;
          break;
        default:
          aValue = new Date(a.uploadedAt).getTime();
          bValue = new Date(b.uploadedAt).getTime();
      }
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    filteredFolderList.sort((a, b) => a.name.localeCompare(b.name));
    setFilteredDocuments(filtered);
    setFilteredFolders(filteredFolderList);
  }, [documents, folders, searchQuery, sortField, sortOrder, showStarredOnly]);

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
      day: 'numeric'
    });
  };

  if (!isClient) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <AlertCircle className="mx-auto w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">Authentication Required</p>
          <p className="text-sm">Please sign in to access your documents</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-2 h-full bg-primary">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-tertiary">
        <div>
          <h2 className="text-2xl font-bold font-serif text-foreground">File Manager</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your documents and folders
          </p>
        </div>
        
        {/* Bulk Actions */}
        {selectedDocs.size > 0 && (
          <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedDocs.size} selected
            </span>
            <span className='flex items-center gap-2'>
              <button
                onClick={handleMoveToClick}
                className="p-3 py-2 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Move className="w-4 h-4" />
                <span className='hidden md:block'>
                  Move To
                </span>
              </button>
              <button
                // onClick={() => handleBulkDelete(Array.from(selectedDocs), currentFolderId, false)}
                className="p-3 py-2 bg-destructive text-primary rounded-md text-xs hover:bg-destructive/80 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span className='hidden md:block'>
                  Delete
                </span>
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <FileManagerToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showStarredOnly={showStarredOnly}
        setShowStarredOnly={setShowStarredOnly}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onSort={handleSort}
        setShowCreateFolderModal={setShowCreateFolderModal}
      />

      {/* Navigation */}
      <div className="p-4 px-6 pt-2 mb-2">
        <FolderNavigation folders={breadcrumbs} onNavigate={navigateToFolder} />
      </div>

      {error && (
        <div className="mb-4 mx-4 p-4 bg-destructive/10 border border-destructive rounded-md text-destructive">
          <AlertCircle className="w-5 h-5 inline mr-2" />
          {error}
        </div>
      )}

      {/* Content */}
      {filteredDocuments.length === 0 && filteredFolders.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            {documents.length === 0 && folders.length === 0 ? (
              <>
                <Upload className="mx-auto w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No documents or folders</p>
                <p className="text-sm">Upload a document or create a folder to get started</p>
              </>
            ) : (
              <>
                <Search className="mx-auto w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No items found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </>
            )}
          </div>
        </div>
      ) : (
        <FileGrid
          folders={filteredFolders}
          documents={filteredDocuments}
          viewMode={viewMode}
          currentDocumentId={currentDocumentId}
          selectedDocs={selectedDocs}
          onDocumentSelect={handleDocumentClick}
          onDocumentContextMenu={handleDocumentContextMenu}
          onFolderContextMenu={handleFolderContextMenu}
          onFolderNavigate={navigateToFolder}
          onFolderDelete={deleteFolder}
          onDocumentDelete={deleteDocument}
          onViewPDF={(doc) => setPdfViewer({ isOpen: true, document: doc })}
          onViewDetails={(doc) => setFileDetails({ isOpen: true, document: doc, folder: null })}
          onToggleSelection={toggleDocumentSelection}
          onMoveDocuments={moveDocuments}
          onShowMoveToModal={handleShowMoveToModal}
          onShowRenameModal={handleShowRenameModal}
          formatFileSize={formatFileSize}
          formatDate={formatDate}
        />
      )}

             {/* Enhanced Context Menu */}
       {contextMenu.isOpen && (
         <div
           className="fixed z-50 bg-primary border border-tertiary rounded-md shadow-lg py-2 min-w-[180px]"
           style={{ left: contextMenu.position.x, top: contextMenu.position.y }}
           onClick={(e) => e.stopPropagation()}
         >
           {!contextMenu.isFolder && contextMenu.documentId && (
             <>
               <button
                 onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   const doc = documents.find(d => d.id === contextMenu.documentId);
                   if (doc) setPdfViewer({ isOpen: true, document: doc });
                   setContextMenu({ ...contextMenu, isOpen: false });
                 }}
                 className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-foreground"
               >
                 <Eye className="w-4 h-4" />
                 View PDF
               </button>
               <button
                 onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   onDocumentSelect?.(contextMenu.documentId!);
                   setContextMenu({ ...contextMenu, isOpen: false });
                 }}
                 className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-foreground"
               >
                 <MessageSquare className="w-4 h-4" />
                 Open in Chat
               </button>
               <button
                 onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   const doc = documents.find(d => d.id === contextMenu.documentId);
                   if (doc) {
                     handleShowMoveToModal([doc]);
                   }
                   setContextMenu({ ...contextMenu, isOpen: false });
                 }}
                 className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-foreground"
               >
                 <Move className="w-4 h-4" />
                 Move To
               </button>
               <button
                 onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   const doc = documents.find(d => d.id === contextMenu.documentId);
                   if (doc) {
                     handleShowRenameModal(doc, 'document');
                   }
                   setContextMenu({ ...contextMenu, isOpen: false });
                 }}
                 className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-foreground"
               >
                 <Edit className="w-4 h-4" />
                 Rename
               </button>
               <button
                 onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   const doc = documents.find(d => d.id === contextMenu.documentId);
                   if (doc) setFileDetails({ isOpen: true, document: doc, folder: null });
                   setContextMenu({ ...contextMenu, isOpen: false });
                 }}
                 className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-foreground"
               >
                 <Info className="w-4 h-4" />
                 View Details
               </button>
               <div className="border-t border-tertiary my-1"></div>
               <button
                 onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   if (contextMenu.documentId) deleteDocument(contextMenu.documentId);
                   setContextMenu({ ...contextMenu, isOpen: false });
                 }}
                 className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-destructive"
               >
                 <Trash2 className="w-4 h-4" />
                 Delete
               </button>
             </>
           )}
           
           {contextMenu.isFolder && contextMenu.folderId && (
             <>
               <button
                 onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   navigateToFolder(contextMenu.folderId!);
                   setContextMenu({ ...contextMenu, isOpen: false });
                 }}
                 className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-foreground"
               >
                 <Folder className="w-4 h-4" />
                 Open Folder
               </button>
               <button
                 onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   const folder = folders.find(f => f.id === contextMenu.folderId);
                   if (folder) {
                     handleShowRenameModal(folder, 'folder');
                   }
                   setContextMenu({ ...contextMenu, isOpen: false });
                 }}
                 className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-foreground"
               >
                 <Edit className="w-4 h-4" />
                 Rename Folder
               </button>
               <button
                 onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   const folder = folders.find(f => f.id === contextMenu.folderId);
                   if (folder) setFileDetails({ isOpen: true, document: null, folder });
                   setContextMenu({ ...contextMenu, isOpen: false });
                 }}
                 className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-foreground"
               >
                 <Info className="w-4 h-4" />
                 Folder Details
               </button>
               <div className="border-t border-tertiary my-1"></div>
               <button
                 onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   if (contextMenu.folderId) deleteFolder(contextMenu.folderId);
                   setContextMenu({ ...contextMenu, isOpen: false });
                 }}
                 className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-destructive"
               >
                 <Trash2 className="w-4 h-4" />
                 Delete Folder
               </button>
             </>
           )}
         </div>
       )}

      {/* Click outside to close context menu */}
      {contextMenu.isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setContextMenu({ ...contextMenu, isOpen: false })}
        />
      )}

      {/* Modals */}
      <CreateFolderModal
        isOpen={showCreateFolderModal}
        onClose={() => setShowCreateFolderModal(false)}
        onCreate={createFolder}
        parentFolder={breadcrumbs.length > 0 ? { 
          id: currentFolderId || '', 
          name: breadcrumbs[breadcrumbs.length - 1]?.name || '',
          path: breadcrumbs.map(b => b.name).join('/'),
          created_at: '',
          updated_at: ''
        } : null}
      />

      {/* Move To Modal */}
      <MoveToModal
        isOpen={moveToModal.isOpen}
        onClose={() => setMoveToModal({ isOpen: false, selectedDocuments: [] })}
        onMove={handleMoveDocuments}
        folders={allFolders}
        currentFolderId={currentFolderId}
        selectedDocuments={moveToModal.selectedDocuments}
      />

      {/* Rename Modal */}
      <RenameModal
        isOpen={renameModal.isOpen}
        onClose={() => setRenameModal({ isOpen: false, item: null, itemType: 'document' })}
        onRename={handleRename}
        item={renameModal.item}
        itemType={renameModal.itemType}
      />

      {/* PDF Viewer */}
      <PDFViewer
        isOpen={pdfViewer.isOpen}
        document={pdfViewer.document}
        onClose={() => setPdfViewer({ isOpen: false, document: null })}
        onOpenInChat={onDocumentSelect}
      />

      {/* File Details Modal */}
      <FileDetailsModal
        isOpen={fileDetails.isOpen}
        document={fileDetails.document}
        folder={fileDetails.folder}
        onClose={() => setFileDetails({ isOpen: false, document: null, folder: null })}
      />

      {/* Delete Folder Confirmation Modal */}
      <DeleteFolderModal
        isOpen={deleteFolderModal.isOpen}
        folder={deleteFolderModal.folder}
        onClose={() => setDeleteFolderModal({ isOpen: false, folder: null })}
        onConfirm={handleDeleteFolderConfirm}
      />
    </div>
  );
}