'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Trash2, 
  Download, 
  Calendar, 
  HardDrive, 
  AlertCircle, 
  Search,
  Filter,
  Grid,
  List,
  SortAsc,
  SortDesc,
  Star,
  Clock,
  File,
  Upload,
  MoreHorizontal,
  MessageSquare
} from 'lucide-react';
import { apiService, handleApiError, Document } from '../lib/api';
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
  status: 'processing' | 'ready';
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

export default function FileManager({ onDocumentSelect, currentDocumentId }: FileManagerProps) {
  const { isAuthenticated, user } = useAuth();
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>('');
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('uploadedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showStarredOnly, setShowStarredOnly] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    filterAndSortDocuments();
  }, [documents, searchQuery, sortField, sortOrder, showStarredOnly]);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      if (isAuthenticated) {
        // Load from database - only INDEXED documents
        const data = await apiService.getDocuments();
        const formattedDocs = data.documents
          .filter(doc => doc.status === 'indexed') // Only show indexed documents
          .map(doc => ({
            id: doc.id,
            filename: doc.filename,
            originalName: doc.originalName,
            size: doc.size,
            uploadedAt: doc.uploadedAt,
            pages: doc.pageCount,
            status: 'ready' as const,
            chatSessionsCount: doc.chatSessionsCount,
            starred: false,
            lastAccessed: undefined
          }));
        setDocuments(formattedDocs);
      } else {
        // Load from user-specific localStorage for non-authenticated users
        const userKey = user?.id ? `uploaded_documents_${user.id}` : 'uploaded_documents';
        const saved = localStorage.getItem(userKey);
        if (saved) {
          const docs = JSON.parse(saved);
          // Only show ready documents for localStorage users
          const readyDocs = docs.filter((doc: DocumentInfo) => doc.status === 'ready');
          setDocuments(readyDocs);
        }
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
      setError(handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  };


  const filterAndSortDocuments = () => {
    let filtered = [...documents];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(doc => 
        doc.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply starred filter
    if (showStarredOnly) {
      filtered = filtered.filter(doc => doc.starred);
    }

    // Apply sorting
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

  const handleDocumentSelect = (docId: string) => {
    // Update last accessed time
    const updatedDocs = documents.map(doc => 
      doc.id === docId 
        ? { ...doc, lastAccessed: new Date().toISOString() }
        : doc
    );
    setDocuments(updatedDocs);
    
    // Save to appropriate storage
    if (!isAuthenticated) {
      localStorage.setItem('uploaded_documents', JSON.stringify(updatedDocs));
    }
    
    onDocumentSelect?.(docId);
  };

  const toggleStar = (docId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const updatedDocs = documents.map(doc => 
      doc.id === docId 
        ? { ...doc, starred: !doc.starred }
        : doc
    );
    setDocuments(updatedDocs);
    
    // Save to appropriate storage
    if (!isAuthenticated) {
      localStorage.setItem('uploaded_documents', JSON.stringify(updatedDocs));
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
        // Delete from database
        await apiService.deleteDocument(docId);
      } else {
        // Delete from localStorage
        const saved = localStorage.getItem('uploaded_documents');
        if (saved) {
          const docs = JSON.parse(saved);
          const updatedDocs = docs.filter((d: DocumentInfo) => d.id !== docId);
          localStorage.setItem('uploaded_documents', JSON.stringify(updatedDocs));
        }
      }
      
      // Update local state
      setDocuments(prev => prev.filter(d => d.id !== docId));
      
      // Update selections
      const newSelected = new Set(selectedDocs);
      newSelected.delete(docId);
      setSelectedDocs(newSelected);

      // Reset system if this was the current document
      if (docId === currentDocumentId) {
        await apiService.resetSystem();
      }
    } catch (error) {
      setError(handleApiError(error));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocs.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedDocs.size} document(s)?`)) {
      return;
    }

    try {
      if (isAuthenticated) {
        // Delete from database
        for (const docId of selectedDocs) {
          await apiService.deleteDocument(docId);
        }
      } else {
        // Delete from localStorage
        const saved = localStorage.getItem('uploaded_documents');
        if (saved) {
          const docs = JSON.parse(saved);
          const updatedDocs = docs.filter((doc: DocumentInfo) => !selectedDocs.has(doc.id));
          localStorage.setItem('uploaded_documents', JSON.stringify(updatedDocs));
        }
      }
      
      // Update local state
      const updatedDocs = documents.filter(doc => !selectedDocs.has(doc.id));
      setDocuments(updatedDocs);
      setSelectedDocs(new Set());

      if (selectedDocs.has(currentDocumentId || '')) {
        await apiService.resetSystem();
      }
    } catch (error) {
      setError(handleApiError(error));
    }
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

  if (isLoading) {
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
        {/* Search */}
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

        {/* Filters and View Controls */}
        <div className="flex items-center space-x-2">
          {/* Starred Filter */}
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

          {/* Sort Controls */}
          <div className="flex flex-wrap gap-2 cursor-pointer rounded-lg">
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
          </div>

          {/* View Mode Toggle */}
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

          {/* Bulk Actions */}
          {selectedDocs.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedDocs.size})
            </button>
          )}
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
                    onClick={() => handleDocumentSelect(doc.id)}
                  >
                    {/* Checkbox */}
                    <div className="col-span-1 flex items-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedDocs.has(doc.id)}
                        onChange={() => toggleDocumentSelection(doc.id)}
                        className="rounded"
                      />
                    </div>

                    {/* File Info */}
                    <div className="col-span-4 flex items-center">
                      <FileText className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
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

                      {/* Star */}
                      <button
                        onClick={(e) => toggleStar(doc.id, e)}
                        className="text-gray-400 hover:text-yellow-500 transition-colors"
                      >
                        <Star className={`w-4 h-4 ${doc.starred ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Grid View */
            <div className="flex-1 overflow-y-auto px-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className={`border rounded-lg p-4 transition-colors cursor-pointer hover:shadow-md ${
                      selectedDocs.has(doc.id)
                        ? 'border-blue-500 bg-blue-50'
                        : currentDocumentId === doc.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-white'
                    }`}
                    onClick={() => handleDocumentSelect(doc.id)}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedDocs.has(doc.id)}
                          onChange={() => toggleDocumentSelection(doc.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded"
                        />
                      </div>
                
                      {/* More Options */}
                      <div className="flex-shrink-0">
                        <button
                          onClick={(e) => toggleStar(doc.id, e)}
                          className="rounded-full p-1 hover:bg-gray-200 cursor-pointer transition-colors duration-200"
                        >
                          <Star className={`w-4 h-4 ${doc.starred ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                        </button>

                        <button className=" rounded-full p-1 hover:bg-gray-200 cursor-pointer transition-colors duration-200">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* File Icon */}
                    <div className="flex justify-center mb-3">
                      <FileText className="w-12 h-12 text-red-500" />
                    </div>

                    {/* File Info */}
                    <div className="text-center">
                      <h3 className="font-medium text-gray-900 truncate mb-1" title={doc.originalName}>
                        {doc.originalName}
                      </h3>
                      <div className="space-y-1 text-xs text-gray-500">
                        <p>{formatFileSize(doc.size)} • {doc.pages || 'N/A'} pages</p>
                        <p>{formatDate(doc.uploadedAt)}</p>
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
            <span className="text-blue-600">
              {selectedDocs.size} document{selectedDocs.size !== 1 ? 's' : ''} selected
            </span>
          )}
        </div>
      </div>
    </div>
  );
}