'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Trash2, Eye, Download, Calendar, HardDrive, AlertCircle } from 'lucide-react';
import { apiService, handleApiError } from '../lib/api';

interface DocumentInfo {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  uploadedAt: string;
  pages?: number;
  status: 'processing' | 'ready' | 'error';
}

interface FileManagerProps {
  onDocumentSelect?: (docId: string) => void;
  currentDocumentId?: string;
}

export default function FileManager({ onDocumentSelect, currentDocumentId }: FileManagerProps) {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      // Load documents from localStorage for now
      // In a real app, this would be an API call
      const saved = localStorage.getItem('uploaded_documents');
      if (saved) {
        const docs = JSON.parse(saved);
        setDocuments(docs);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
      setError('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentSelect = (docId: string) => {
    setSelectedDoc(docId);
    onDocumentSelect?.(docId);
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      // Remove from localStorage
      const saved = localStorage.getItem('uploaded_documents');
      if (saved) {
        const docs = JSON.parse(saved);
        const updatedDocs = docs.filter((doc: DocumentInfo) => doc.id !== docId);
        localStorage.setItem('uploaded_documents', JSON.stringify(updatedDocs));
        setDocuments(updatedDocs);
      }

      // Reset system if this was the current document
      if (docId === currentDocumentId) {
        await apiService.resetSystem();
      }
    } catch (error) {
      setError(handleApiError(error));
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Documents</h2>
        <div className="flex items-center text-sm text-gray-600">
          <HardDrive className="w-4 h-4 mr-1" />
          {documents.length} document{documents.length !== 1 ? 's' : ''}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          <AlertCircle className="w-5 h-5 inline mr-2" />
          {error}
        </div>
      )}

      {documents.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <FileText className="mx-auto w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No documents uploaded</p>
            <p className="text-sm">Upload a PDF document to get started</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 p-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-600 mb-4">
            <div className="col-span-4">Name</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-2">Pages</div>
            <div className="col-span-2">Uploaded</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">Actions</div>
          </div>

          {/* Document List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`grid grid-cols-12 gap-4 p-4 border rounded-lg transition-colors cursor-pointer hover:bg-gray-50 ${
                  selectedDoc === doc.id || currentDocumentId === doc.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
                onClick={() => handleDocumentSelect(doc.id)}
              >
                {/* File Name */}
                <div className="col-span-4 flex items-center">
                  <FileText className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{doc.originalName}</p>
                    <p className="text-sm text-gray-500 truncate">{doc.filename}</p>
                  </div>
                </div>

                {/* File Size */}
                <div className="col-span-2 flex items-center text-sm text-gray-600">
                  {formatFileSize(doc.size)}
                </div>

                {/* Pages */}
                <div className="col-span-2 flex items-center text-sm text-gray-600">
                  {doc.pages ? `${doc.pages} pages` : 'Unknown'}
                </div>

                {/* Upload Date */}
                <div className="col-span-2 flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(doc.uploadedAt)}
                </div>

                {/* Status */}
                <div className="col-span-1 flex items-center">
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${
                      doc.status === 'ready'
                        ? 'bg-green-100 text-green-800'
                        : doc.status === 'processing'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {doc.status === 'ready' ? 'Ready' : doc.status === 'processing' ? 'Processing' : 'Error'}
                  </span>
                </div>

                {/* Actions */}
                <div className="col-span-1 flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDocument(doc.id);
                    }}
                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>
            Total storage: {formatFileSize(documents.reduce((total, doc) => total + doc.size, 0))}
          </span>
          {selectedDoc && (
            <span className="text-blue-600">
              Document selected
            </span>
          )}
        </div>
      </div>
    </div>
  );
}