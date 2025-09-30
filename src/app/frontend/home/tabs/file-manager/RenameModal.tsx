// src/app/frontend/components/RenameModal.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Edit, FileText, Folder, AlertCircle } from 'lucide-react';

interface DocumentInfo {
  id: string;
  fileName: string;
  originalFileName: string;
  size: number;
  uploadedAt: string;
  pages?: number;
  status: 'PROCESSING' | 'READY' | 'INDEXED' | 'UPLOADED' | 'TEMPORARY' | 'FAILED';
  starred?: boolean;
  chatSessionsCount?: number;
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

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: (newName: string) => Promise<void>;
  item: DocumentInfo | FolderInfo | null;
  itemType: 'document' | 'folder';
}

export const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  onClose,
  onRename,
  item,
  itemType
}) => {
  const [newName, setNewName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && item) {
      if (itemType === 'document') {
        const doc = item as DocumentInfo;
        // Remove file extension for editing
        const nameWithoutExt = doc.fileName.replace(/\.[^/.]+$/, '');
        setNewName(nameWithoutExt);
      } else {
        const folder = item as FolderInfo;
        setNewName(folder.name);
      }
      setError('');
    }
  }, [isOpen, item, itemType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newName.trim()) {
      setError('Name cannot be empty');
      return;
    }

    // Validate name
    if (newName.trim().length < 1) {
      setError('Name must be at least 1 character long');
      return;
    }

    if (newName.length > 255) {
      setError('Name must be less than 255 characters');
      return;
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (invalidChars.test(newName)) {
      setError('Name contains invalid characters');
      return;
    }

    setIsRenaming(true);
    setError('');

    try {
      let finalName = newName.trim();
      
      // For documents, add back the file extension
      if (itemType === 'document' && item) {
        const doc = item as DocumentInfo;
        const extension = doc.fileName.match(/\.[^/.]+$/);
        if (extension) {
          finalName += extension[0];
        }
      }

      await onRename(finalName);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen || !item) return null;

  const currentName = itemType === 'document' 
    ? (item as DocumentInfo).fileName 
    : (item as FolderInfo).name;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-primary rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b border-tertiary">
          <div className="flex items-center">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Rename {itemType === 'document' ? 'Document' : 'Folder'}
              </h2>
              <p className="text-sm text-muted-foreground">
                Enter a new name for "{currentName}"
              </p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="rename-input" className="block text-sm font-medium text-foreground mb-2">
                {itemType === 'document' ? 'Document name' : 'Folder name'}
              </label>
              <input
                id="rename-input"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-3 py-2 border border-tertiary rounded-md bg-primary text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`Enter ${itemType} name`}
                autoFocus
                disabled={isRenaming}
              />
              {itemType === 'document' && (
                <p className="text-xs text-muted-foreground mt-1">
                  File extension will be preserved automatically
                </p>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive rounded-md text-destructive">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              disabled={isRenaming}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRenaming || !newName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              {isRenaming && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <Edit className="w-4 h-4" />
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};