// src/app/frontend/components/DeleteFolderModal.tsx
'use client';
import React, { useState } from 'react';
import { X, AlertTriangle, Folder, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/app/frontend/components/ui/button';

interface FolderInfo {
  id: string;
  name: string;
  documentCount: number;
  subfolderCount: number;
  hasDocuments: boolean;
  hasSubfolders: boolean;
  subfolders: Array<{
    id: string;
    name: string;
    documentCount: number;
    subfolderCount: number;
  }>;
}

interface DeleteFolderModalProps {
  isOpen: boolean;
  folder: FolderInfo | null;
  onClose: () => void;
  onConfirm: (force: boolean) => Promise<void>;
}

export const DeleteFolderModal: React.FC<DeleteFolderModalProps> = ({
  isOpen,
  folder,
  onClose,
  onConfirm
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteOption, setDeleteOption] = useState<'cancel' | 'contents' | 'folder-only'>('cancel');

  if (!isOpen || !folder) return null;

  const handleConfirm = async () => {
    if (deleteOption === 'cancel') return;

    setIsDeleting(true);
    try {
      if (deleteOption === 'contents') {
        // Delete folder and all contents
        await onConfirm(true);
      } else {
        // This shouldn't happen since we only show this modal when folder has contents
        await onConfirm(false);
      }
      onClose();
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setDeleteOption('cancel');
      onClose();
    }
  };

  const totalItems = folder.documentCount + folder.subfolderCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      
      <div className="relative bg-primary border border-tertiary rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-tertiary">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            <h3 className="text-lg font-semibold text-foreground">Delete Folder</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="mb-4">
            <p className="text-foreground mb-2">
              The folder <strong>"{folder.name}"</strong> is not empty.
            </p>
            
            {/* Contents Summary */}
            <div className="bg-tertiary rounded-lg p-3 mb-4">
              <h4 className="font-medium text-foreground mb-2">Contents:</h4>
              <div className="space-y-1 text-sm">
                {folder.hasSubfolders && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Folder className="w-4 h-4 text-blue-500" />
                    <span>{folder.subfolderCount} subfolder{folder.subfolderCount !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {folder.hasDocuments && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="w-4 h-4 text-red-500" />
                    <span>{folder.documentCount} document{folder.documentCount !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Subfolders Details */}
            {folder.subfolders.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-foreground mb-2">Subfolders:</h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {folder.subfolders.map((subfolder) => (
                    <div key={subfolder.id} className="flex items-center justify-between text-sm bg-tertiary/50 rounded px-2 py-1">
                      <div className="flex items-center gap-2">
                        <Folder className="w-3 h-3 text-blue-500" />
                        <span className="text-foreground">{subfolder.name}</span>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {subfolder.documentCount} docs, {subfolder.subfolderCount} folders
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Options */}
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">What would you like to do?</p>
              
              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 border border-tertiary rounded-lg cursor-pointer hover:bg-accent transition-colors">
                  <input
                    type="radio"
                    name="deleteOption"
                    value="contents"
                    checked={deleteOption === 'contents'}
                    onChange={(e) => setDeleteOption(e.target.value as any)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-foreground flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-destructive" />
                      Delete folder and all contents
                    </div>
                    <div className="text-sm text-muted-foreground">
                      This will permanently delete the folder, all {folder.subfolderCount} subfolder{folder.subfolderCount !== 1 ? 's' : ''}, 
                      and all {folder.documentCount} document{folder.documentCount !== 1 ? 's' : ''}. This action cannot be undone.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border border-tertiary rounded-lg cursor-pointer hover:bg-accent transition-colors opacity-50">
                  <input
                    type="radio"
                    name="deleteOption"
                    value="cancel"
                    checked={deleteOption === 'cancel'}
                    onChange={(e) => setDeleteOption(e.target.value as any)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-foreground">Cancel deletion</div>
                    <div className="text-sm text-muted-foreground">
                      Keep the folder and organize its contents manually.
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-tertiary bg-tertiary rounded-b-lg flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
            className="border-tertiary text-foreground hover:bg-accent"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isDeleting || deleteOption === 'cancel'}
            className={`${
              deleteOption === 'contents' 
                ? 'bg-destructive hover:bg-destructive/90 text-white' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isDeleting ? 'Deleting...' : 'Confirm'}
          </Button>
        </div>
      </div>
    </div>
  );
};