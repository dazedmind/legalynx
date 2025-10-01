// src/app/frontend/components/CreateFolderModal.tsx
'use client';
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/app/frontend/components/ui/button';
import { Input } from '@/app/frontend/components/ui/input';

interface FolderInfo {
  id: string;
  name: string;
  path: string;
  created_at: string;
  updated_at: string;
}

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
  parentFolder?: FolderInfo | null;
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  parentFolder
}) => {
  const [folderName, setFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    setIsCreating(true);
    setError('');

    try {
      await onCreate(folderName.trim());
      setFolderName('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-primary border border-tertiary rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-tertiary">
          <h3 className="text-lg font-semibold text-foreground">Create New Folder</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          {parentFolder && (
            <div className="mb-4 p-3 bg-tertiary rounded-md">
              <p className="text-sm text-muted-foreground">
                Creating folder in: <span className="font-medium text-foreground">{parentFolder.path}</span>
              </p>
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">Folder Name</label>
            <Input
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Enter folder name..."
              disabled={isCreating}
              autoFocus
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-md text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isCreating} className="cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" disabled={!folderName.trim() || isCreating} className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
              {isCreating ? 'Creating...' : 'Create Folder'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};