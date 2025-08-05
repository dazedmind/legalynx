// src/app/frontend/components/FolderNavigation.tsx
'use client';
import React from 'react';
import { Home, ChevronRight } from 'lucide-react';

interface FolderNavigationProps {
  folders: { id: string; name: string }[];
  onNavigate: (folderId: string | null) => void;
}

export const FolderNavigation: React.FC<FolderNavigationProps> = ({ folders, onNavigate }) => {
  return (
    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
      <button onClick={() => onNavigate(null)} className="flex items-center hover:text-foreground transition-colors">
        <Home className="w-4 h-4 mr-1" />
        Root
      </button>
      
      {folders.map((folder, index) => (
        <React.Fragment key={folder.id}>
          <ChevronRight className="w-4 h-4" />
          <button
            onClick={() => onNavigate(folder.id)}
            className={`hover:text-foreground transition-colors ${
              index === folders.length - 1 ? 'text-foreground font-medium' : ''
            }`}
          >
            {folder.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};