// src/app/frontend/hooks/useDragAndDrop.ts
'use client';
import { useState, useCallback } from 'react';

interface DragItem {
  id: string;
  type: 'document' | 'folder';
  name: string;
}

interface DropZone {
  id: string | null; // null for root folder
  type: 'folder' | 'root';
  name: string;
}

export const useDragAndDrop = () => {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dragOverZone, setDragOverZone] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const startDrag = useCallback((item: DragItem) => {
    setDraggedItem(item);
    setIsDragging(true);
    console.log('🎯 Started dragging:', item);
  }, []);

  const endDrag = useCallback(() => {
    setDraggedItem(null);
    setDragOverZone(null);
    setIsDragging(false);
    console.log('🎯 Ended dragging');
  }, []);

  const enterDropZone = useCallback((zoneId: string | null) => {
    if (draggedItem) {
      setDragOverZone(zoneId);
      console.log('🎯 Entered drop zone:', zoneId);
    }
  }, [draggedItem]);

  const leaveDropZone = useCallback(() => {
    setDragOverZone(null);
  }, []);

  const canDrop = useCallback((targetId: string | null): boolean => {
    if (!draggedItem) return false;
    
    // Can't drop item on itself
    if (draggedItem.id === targetId) return false;
    
    // Can't drop folder into its own children (would need recursive check in real app)
    // For now, we'll allow it and let the backend handle the validation
    
    return true;
  }, [draggedItem]);

  return {
    draggedItem,
    dragOverZone,
    isDragging,
    startDrag,
    endDrag,
    enterDropZone,
    leaveDropZone,
    canDrop
  };
};