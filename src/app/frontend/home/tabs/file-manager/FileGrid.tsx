// src/app/frontend/components/FileGrid.tsx - Complete Enhanced Version with Rename
"use client";
import React, { useState } from "react";
import {
  FileText,
  Folder,
  Star,
  MessageSquare,
  MoreHorizontal,
  Info,
  Trash2,
  Eye,
  Move,
  Edit,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface DocumentInfo {
  id: string;
  fileName: string;
  originalFileName: string;
  size: number;
  uploadedAt: string;
  pages?: number;
  status:
    | "PROCESSING"
    | "READY"
    | "INDEXED"
    | "UPLOADED"
    | "TEMPORARY"
    | "FAILED";
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

interface FileGridProps {
  folders: FolderInfo[];
  documents: DocumentInfo[];
  viewMode: "grid" | "list";
  currentDocumentId?: string;
  selectedDocs: Set<string>;
  onDocumentSelect?: (docId: string) => void;
  onDocumentContextMenu: (e: React.MouseEvent, docId: string) => void;
  onFolderContextMenu: (e: React.MouseEvent, folderId: string) => void;
  onFolderNavigate: (folderId: string) => void;
  onFolderDelete: (folderId: string) => void;
  onDocumentDelete: (docId: string) => void;
  onViewPDF: (document: DocumentInfo) => void;
  onViewDetails: (document: DocumentInfo) => void;
  onToggleSelection: (docId: string) => void;
  onMoveDocuments?: (
    documentIds: string[],
    targetFolderId: string | null
  ) => void;
  onShowMoveToModal?: (documents: DocumentInfo[]) => void;
  onShowRenameModal?: (
    item: DocumentInfo | FolderInfo,
    itemType: "document" | "folder"
  ) => void;
  formatFileSize: (bytes: number) => string;
  formatDate: (dateString: string) => string;
}

export const FileGrid: React.FC<FileGridProps> = ({
  folders,
  documents,
  viewMode,
  currentDocumentId,
  selectedDocs,
  onDocumentSelect,
  onDocumentContextMenu,
  onFolderContextMenu,
  onFolderNavigate,
  onFolderDelete,
  onDocumentDelete,
  onViewPDF,
  onViewDetails,
  onToggleSelection,
  onMoveDocuments,
  onShowMoveToModal,
  onShowRenameModal,
  formatFileSize,
  formatDate,
}) => {
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    draggedItems: string[];
    dragOverFolder: string | null;
  }>({
    isDragging: false,
    draggedItems: [],
    dragOverFolder: null,
  });

  // Drag handlers for documents
  const handleDragStart = (e: React.DragEvent, documentId: string) => {
    const draggedItems = selectedDocs.has(documentId)
      ? Array.from(selectedDocs)
      : [documentId];

    setDragState({
      isDragging: true,
      draggedItems,
      dragOverFolder: null,
    });

    // Set drag data
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({
        type: "documents",
        items: draggedItems,
      })
    );
    e.dataTransfer.effectAllowed = "move";

    // Add visual feedback
    (e.currentTarget as HTMLElement).style.opacity = "0.5";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDragState({
      isDragging: false,
      draggedItems: [],
      dragOverFolder: null,
    });
    (e.currentTarget as HTMLElement).style.opacity = "1";
  };

  // Drag handlers for folders (drop targets)
  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (dragState.dragOverFolder !== folderId) {
      setDragState((prev) => ({
        ...prev,
        dragOverFolder: folderId,
      }));
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the folder entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragState((prev) => ({
        ...prev,
        dragOverFolder: null,
      }));
    }
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();

    try {
      const dragData = JSON.parse(e.dataTransfer.getData("text/plain"));

      if (dragData.type === "documents" && dragData.items && onMoveDocuments) {
        onMoveDocuments(dragData.items, targetFolderId);
      }
    } catch (error) {
      console.error("Error parsing drag data:", error);
    }

    setDragState({
      isDragging: false,
      draggedItems: [],
      dragOverFolder: null,
    });
  };

  // Handle drop on root area (move to root)
  const handleRootDrop = (e: React.DragEvent) => {
    handleDrop(e, null);
  };

  const handleRootDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  // Handle single document move to modal
  const handleSingleDocumentMoveToModal = (document: DocumentInfo) => {
    if (onShowMoveToModal) {
      onShowMoveToModal([document]);
    }
  };

  const truncateString = (str: string, maxLength: number): string => {
    return str.length > maxLength ? str.substring(0, maxLength) + "..." : str;
  };

  if (viewMode === "grid") {
    return (
      <div
        className="flex-1 overflow-hidden px-4"
        onDrop={handleRootDrop}
        onDragOver={handleRootDragOver}
      >
        <div className="h-full overflow-y-auto document-list">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
            {/* Folders */}
            {folders.map((folder) => (
              <div
                key={folder.id}
                className={`group bg-primary border border-tertiary rounded-lg p-4 transition-all duration-200 cursor-pointer
                   ${selectedDocs.has(folder.id) ? "selected-item" : ""}
                   `}
                onDoubleClick={() => onFolderNavigate(folder.id)}
                onContextMenu={(e) => onFolderContextMenu(e, folder.id)}
                onDragOver={(e) => handleDragOver(e, folder.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, folder.id)}
              >
                <div className="flex justify-between items-start">
                  {/* Selection checkbox */}
                  <div className={`opacity-0 ${selectedDocs.has(folder.id) ? "opacity-100" : ""} group-hover:opacity-100 transition-opacity`}>
                    <input
                      type="checkbox"
                      checked={selectedDocs.has(folder.id)}
                      onChange={() => onToggleSelection(folder.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="p-1 hover:bg-accent rounded-md transition-colors cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => onFolderNavigate(folder.id)}
                      >
                        <Folder className="w-4 h-4" />
                        Open Folder
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onShowRenameModal?.(folder, "folder")}
                      >
                        <Edit className="w-4 h-4" />
                        Rename Folder
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onFolderDelete(folder.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Folder
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="text-center flex flex-col items-center no-select">
                  <Folder
                    className={`w-12 h-12 mb-2 ${
                      dragState.dragOverFolder === folder.id
                        ? "text-blue-600"
                        : "text-blue-500"
                    }`}
                  />

                  <h3 className="font-medium text-foreground truncate mb-1">
                    {truncateString(folder.name, 20)}
                  </h3>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>{formatDate(folder.created_at)}</p>
                  </div>
                  {dragState.dragOverFolder === folder.id && (
                    <div className="mt-2 text-xs text-blue-600 font-medium">
                      Drop to move here
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Documents */}
            {documents.map((doc) => (
              <div
                key={doc.id}
                draggable
                className={`group relative bg-primary border border-tertiary rounded-lg p-4 transition-all duration-200 cursor-pointer 
                 ${selectedDocs.has(doc.id) ? "selected-item" : ""} ${
                  dragState.isDragging &&
                  dragState.draggedItems.includes(doc.id)
                    ? "opacity-50"
                    : ""
                }`}
                onContextMenu={(e) => onDocumentContextMenu(e, doc.id)}
                onDragStart={(e) => handleDragStart(e, doc.id)}
                onDragEnd={handleDragEnd}
                onDoubleClick={() => onDocumentSelect?.(doc.id)} // Double-click to view PDF
              >
                <div className="flex justify-between items-center">
                  {/* Selection checkbox */}
                  <div className={`opacity-0 ${selectedDocs.has(doc.id) ? "opacity-100" : ""} group-hover:opacity-100 transition-opacity`}>
                    <input
                      type="checkbox"
                      checked={selectedDocs.has(doc.id)}
                      onChange={() => onToggleSelection(doc.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="p-1 hover:bg-accent rounded-md transition-colors cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onViewPDF(doc);
                      }}>
                        <Eye className="w-4 h-4" />
                        View PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDocumentSelect?.(doc.id);
                        }}
                      >
                        <MessageSquare className="w-4 h-4" />
                        Open in Chat
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSingleDocumentMoveToModal(doc);
                        }}
                      >
                        <Move className="w-4 h-4" />
                        Move To
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onShowRenameModal?.(doc, "document");
                        }}
                      >
                        <Edit className="w-4 h-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails(doc);
                      }}>
                        <Info className="w-4 h-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDocumentDelete(doc.id);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="text-center flex flex-col items-center">
                  <div>
                    <FileText className="w-12 h-12 mb-2 text-red-500" />
                  </div>
                  <h3
                    className="font-medium text-foreground mb-1"
                    title={doc.originalFileName}
                  >
                    {truncateString(doc.fileName, 25)}
                  </h3>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>{formatFileSize(doc.size)}</p>
                    <p>{formatDate(doc.uploadedAt)}</p>
                    {doc.chatSessionsCount !== undefined &&
                      doc.chatSessionsCount > 0 && (
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

          {/* Drop zone indicator */}
          {dragState.isDragging && (
            <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
              <div className="flex items-center gap-2">
                <Move className="w-4 h-4" />
                <span className="text-sm">
                  Moving {dragState.draggedItems.length} item
                  {dragState.draggedItems.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div
      className="flex-1 overflow-hidden px-4"
      onDrop={handleRootDrop}
      onDragOver={handleRootDragOver}
    >
      <div className="h-full overflow-y-auto document-list">
        <div className="space-y-2 pb-4">
          {/* Folders */}
          {folders.map((folder) => (
            <div
              key={folder.id}
              className={`group flex items-center justify-between p-3 bg-primary border border-tertiary rounded-lg hover:shadow-sm transition-all duration-200 cursor-pointer 
                ${selectedDocs.has(folder.id) ? "selected-item" : ""}
                ${
                  dragState.dragOverFolder === folder.id
                    ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : ""
                }`}
              onDoubleClick={() => onFolderNavigate(folder.id)}
              onContextMenu={(e) => onFolderContextMenu(e, folder.id)}
              onDragOver={(e) => handleDragOver(e, folder.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, folder.id)}
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className={`opacity-0 ${selectedDocs.has(folder.id) ? "opacity-100" : ""} group-hover:opacity-100 transition-opacity`}>
                  <input
                    type="checkbox"
                    checked={selectedDocs.has(folder.id)}
                    onChange={() => onToggleSelection(folder.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Folder
                    className={`w-6 h-6 flex-shrink-0 ${
                      dragState.dragOverFolder === folder.id
                        ? "text-blue-600"
                        : "text-blue-500"
                    }`}
                  />
                  {dragState.dragOverFolder === folder.id && (
                    <Move className="w-4 h-4 text-blue-600 animate-pulse" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {folder.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {folder.document_count || 0} documents,{" "}
                    {folder.subfolder_count || 0} subfolders
                    {dragState.dragOverFolder === folder.id && (
                      <span className="ml-2 text-blue-600 font-medium">
                        ← Drop here
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>{formatDate(folder.created_at)}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 hover:bg-accent rounded-md transition-colors cursor-pointer">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onFolderNavigate(folder.id)}
                    >
                      <Folder className="w-4 h-4" />
                      Open Folder
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onShowRenameModal?.(folder, "folder")}
                    >
                      <Edit className="w-4 h-4" />
                      Rename Folder
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onFolderDelete(folder.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Folder
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}

          {/* Documents */}
          {documents.map((doc) => (
            <div
              key={doc.id}
              draggable
              className={`group flex items-center justify-between p-3 bg-primary border border-tertiary rounded-lg hover:shadow-sm transition-all duration-200 cursor-pointer ${
                currentDocumentId === doc.id ? "ring-2 ring-blue-500" : ""
              } ${selectedDocs.has(doc.id) ? "selected-item" : ""} ${
                dragState.isDragging && dragState.draggedItems.includes(doc.id)
                  ? "opacity-50"
                  : ""
              }`}
              onContextMenu={(e) => onDocumentContextMenu(e, doc.id)}
              onDragStart={(e) => handleDragStart(e, doc.id)}
              onDragEnd={handleDragEnd}
              onDoubleClick={() => onDocumentSelect?.(doc.id)} // Double-click to view PDF
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className={`opacity-0 ${selectedDocs.has(doc.id) ? "opacity-100" : ""} group-hover:opacity-100 transition-opacity`}>
                  <input
                    type="checkbox"
                    checked={selectedDocs.has(doc.id)}
                    onChange={() => onToggleSelection(doc.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div>
                    <FileText className="w-6 h-6 text-red-500 flex-shrink-0" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">
                      {doc.originalFileName}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(doc.size)}
                    {doc.chatSessionsCount !== undefined &&
                      doc.chatSessionsCount > 0 && (
                        <span className="ml-2 text-blue-600">
                          • {doc.chatSessionsCount} chats
                        </span>
                      )}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>{formatDate(doc.uploadedAt)}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="p-1 hover:bg-accent rounded-md transition-colors cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onViewPDF(doc);
                    }}>
                      <Eye className="w-4 h-4" />
                      View PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDocumentSelect?.(doc.id);
                      }}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Open in Chat
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSingleDocumentMoveToModal(doc);
                      }}
                    >
                      <Move className="w-4 h-4" />
                      Move To
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onShowRenameModal?.(doc, "document");
                      }}
                    >
                      <Edit className="w-4 h-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails(doc);
                    }}>
                      <Info className="w-4 h-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDocumentDelete(doc.id);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>

        {/* Drop zone indicator for list view */}
        {dragState.isDragging && (
          <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
            <div className="flex items-center gap-2">
              <Move className="w-4 h-4" />
              <span className="text-sm">
                Moving {dragState.draggedItems.length} item
                {dragState.draggedItems.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
