// src/app/frontend/components/FileDetailsModal.tsx
'use client';
import React from 'react';
import { X, FileText, Folder, Calendar, HardDrive, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

interface FileDetailsModalProps {
  isOpen: boolean;
  document: DocumentInfo | null;
  folder: FolderInfo | null;
  onClose: () => void;
}

export const FileDetailsModal: React.FC<FileDetailsModalProps> = ({ 
  isOpen, 
  document, 
  folder,
  onClose 
}) => {
  if (!isOpen || (!document && !folder)) return null;

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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      <div className="relative bg-primary border border-tertiary rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-tertiary">
          <div className="flex items-center gap-3">
            {document ? (
              <FileText className="w-6 h-6 text-blue-600" />
            ) : (
              <Folder className="w-6 h-6 text-blue-500" />
            )}
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {document ? 'Document Details' : 'Folder Details'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {document ? document.originalFileName : folder?.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {document && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">File Name</label>
                  <p className="mt-1 text-sm text-foreground break-all">{document.originalFileName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Internal Name</label>
                  <p className="mt-1 text-sm text-foreground break-all">{document.fileName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">File Size</label>
                  <p className="mt-1 text-sm text-foreground">
                    <HardDrive className="w-4 h-4 inline mr-1" />
                    {formatFileSize(document.size)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      document.status === 'INDEXED' ? 'bg-green-700/20 text-green-500' :
                      document.status === 'READY' ? 'bg-blue-700/20 text-blue-600' :
                      'bg-gray-700/20 text-gray-600'
                    }`}>
                      {document.status}
                    </span>
                  </p>
                </div>
                {document.pages && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Pages</label>
                    <p className="mt-1 text-sm text-foreground">{document.pages}</p>
                  </div>
                )}
                {document.mimeType && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">MIME Type</label>
                    <p className="mt-1 text-sm text-foreground">{document.mimeType}</p>
                  </div>
                )}
                {document.chatSessionsCount !== undefined && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Chat Sessions</label>
                    <p className="mt-1 text-sm text-foreground">
                      <MessageSquare className="w-4 h-4 inline mr-1" />
                      {document.chatSessionsCount}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Document ID */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Document ID</label>
                <p className="mt-1 text-sm text-foreground font-mono break-all">{document.id}</p>
              </div>
              
              {/* Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Uploaded</label>
                  <p className="mt-1 text-sm text-foreground">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {formatDate(document.uploadedAt)}
                  </p>
                </div>
                {document.lastAccessed && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Accessed</label>
                    <p className="mt-1 text-sm text-foreground">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {formatDate(document.lastAccessed)}
                    </p>
                  </div>
                )}
              </div>

              {/* Tags */}
              {document.tags && document.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tags</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {document.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {folder && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Folder Name</label>
                  <p className="mt-1 text-sm text-foreground">{folder.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Path</label>
                  <p className="mt-1 text-sm text-foreground break-all">{folder.path}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Documents</label>
                  <p className="mt-1 text-sm text-foreground">{folder.document_count || 0}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Subfolders</label>
                  <p className="mt-1 text-sm text-foreground">{folder.subfolder_count || 0}</p>
                </div>
              </div>
              
              {/* Folder ID */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Folder ID</label>
                <p className="mt-1 text-sm text-foreground font-mono break-all">{folder.id}</p>
              </div>
              
              {/* Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="mt-1 text-sm text-foreground">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {formatDate(folder.created_at)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Modified</label>
                  <p className="mt-1 text-sm text-foreground">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {formatDate(folder.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-tertiary bg-tertiary rounded-b-lg flex justify-end">
          <Button onClick={onClose} className="cursor-pointer">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};