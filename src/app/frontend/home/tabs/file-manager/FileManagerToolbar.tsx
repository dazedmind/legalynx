// src/app/frontend/components/FileManagerToolbar.tsx
'use client';
import React from 'react';
import { Search, Filter, Star, List, Grid, FolderPlus } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

type SortField = 'name' | 'size' | 'uploadedAt' | 'lastAccessed' | 'pages';
type ViewMode = 'grid' | 'list';

interface FileManagerToolbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showStarredOnly: boolean;
  setShowStarredOnly: (show: boolean) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onSort: (field: SortField) => void;
  setShowCreateFolderModal: (show: boolean) => void;
}

export const FileManagerToolbar: React.FC<FileManagerToolbarProps> = ({
  searchQuery,
  setSearchQuery,
  showStarredOnly,
  setShowStarredOnly,
  viewMode,
  setViewMode,
  onSort,
  setShowCreateFolderModal
}) => {
  return (
    <div className="flex flex-row items-center gap-4 p-4 bg-tertiary rounded-lg">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
        <input
          type="text"
          placeholder="Search documents and folders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-tertiary rounded-md bg-primary text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        />
      </div>

      <div className="flex items-center space-x-2">

        <DropdownMenu>
          <DropdownMenuTrigger>
            <span className="flex items-center gap-1 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer border border-tertiary text-foreground hover:bg-accent">
              <Filter className="w-4 h-4" />
              <span className='hidden sm:block'>
                Sort
              </span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onSort('name')}>Name</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSort('uploadedAt')}>Upload Date</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSort('size')}>Size</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSort('pages')}>Pages</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex border border-tertiary rounded-md overflow-hidden">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 cursor-pointer transition-colors ${
              viewMode === 'list' ? 'bg-blue/20 text-blue-700' : ' text-muted-foreground hover:bg-accent'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 cursor-pointer transition-colors ${
              viewMode === 'grid' ? 'bg-blue/20 text-blue-700' : ' text-muted-foreground hover:bg-accent'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>

        <button
            onClick={() => setShowCreateFolderModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            <span className='hidden sm:block'>
              New Folder
            </span>
          </button>
      </div>
    </div>
  );
};