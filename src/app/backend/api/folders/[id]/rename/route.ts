// src/app/backend/api/folders/[id]/rename/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// Helper function to get user from token
async function getUserFromToken(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    throw new Error('No token provided');
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId }
  });
  if (!user) {
    throw new Error('User not found');
  }
  return user;
}

// Helper function to build folder path
async function buildFolderPath(folderId: string): Promise<string> {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    select: { name: true, parent_id: true }
  });
  
  if (!folder) return '';
  
  if (folder.parent_id) {
    const parentPath = await buildFolderPath(folder.parent_id);
    return parentPath ? `${parentPath}/${folder.name}` : folder.name;
  }
  
  return folder.name;
}

// Helper function to update child folder paths
async function updateChildFolderPaths(folderId: string, newBasePath: string) {
  const children = await prisma.folder.findMany({
    where: { parent_id: folderId },
    select: { id: true, name: true }
  });

  for (const child of children) {
    const newChildPath = `${newBasePath}/${child.name}`;
    
    await prisma.folder.update({
      where: { id: child.id },
      data: { 
        path: newChildPath,
        updated_at: new Date()
      }
    });

    // Recursively update grandchildren
    await updateChildFolderPaths(child.id, newChildPath);
  }
}

// PATCH /backend/api/folders/[id]/rename - Rename folder
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(request);
    const folderId = (await params).id;
    const { newName } = await request.json();

    console.log('📁 Rename folder request:', {
      folderId,
      newName,
      userId: user.id
    });

    // Validate input
    if (!folderId) {
      return NextResponse.json({ error: 'Folder ID is required' }, { status: 400 });
    }

    if (!newName || typeof newName !== 'string') {
      return NextResponse.json({ error: 'New name is required' }, { status: 400 });
    }

    const trimmedName = newName.trim();
    if (trimmedName.length === 0) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }

    if (trimmedName.length > 255) {
      return NextResponse.json({ error: 'Name must be less than 255 characters' }, { status: 400 });
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (invalidChars.test(trimmedName)) {
      return NextResponse.json({ error: 'Name contains invalid characters' }, { status: 400 });
    }

    // Find the folder and verify ownership
    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        owner_id: user.id
      },
      select: {
        id: true,
        name: true,
        path: true,
        parent_id: true,
        created_at: true,
        updated_at: true
      }
    });

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    console.log('📂 Found folder:', {
      currentName: folder.name,
      newName: trimmedName,
      currentPath: folder.path
    });

    // Check if name is actually different
    if (folder.name === trimmedName) {
      return NextResponse.json({ 
        message: 'Folder name unchanged',
        folder: {
          id: folder.id,
          name: folder.name,
          path: folder.path,
          parent_id: folder.parent_id,
          created_at: folder.created_at.toISOString(),
          updated_at: folder.updated_at.toISOString()
        }
      });
    }

    // Check if a folder with the same name already exists in the same parent
    const existingFolder = await prisma.folder.findFirst({
      where: {
        name: trimmedName,
        parent_id: folder.parent_id,
        owner_id: user.id,
        id: { not: folderId } // Exclude current folder
      }
    });

    if (existingFolder) {
      return NextResponse.json({ 
        error: 'A folder with this name already exists in this location' 
      }, { status: 409 });
    }

    // Calculate new path
    let newPath: string;
    if (folder.parent_id) {
      const parentPath = await buildFolderPath(folder.parent_id);
      newPath = parentPath ? `${parentPath}/${trimmedName}` : trimmedName;
    } else {
      newPath = trimmedName;
    }

    console.log('📍 New path will be:', newPath);

    // Update the folder
    const updatedFolder = await prisma.folder.update({
      where: { id: folderId },
      data: {
        name: trimmedName,
        path: newPath,
        updated_at: new Date()
      },
      select: {
        id: true,
        name: true,
        path: true,
        parent_id: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            documents: true,
            children: true
          }
        }
      }
    });

    // Update all child folder paths
    await updateChildFolderPaths(folderId, newPath);

    console.log('✅ Folder renamed successfully:', {
      folderId,
      oldName: folder.name,
      newName: trimmedName,
      oldPath: folder.path,
      newPath: newPath
    });

    return NextResponse.json({
      success: true,
      message: 'Folder renamed successfully',
      folder: {
        id: updatedFolder.id,
        name: updatedFolder.name,
        path: updatedFolder.path,
        parent_id: updatedFolder.parent_id,
        created_at: updatedFolder.created_at.toISOString(),
        updated_at: updatedFolder.updated_at.toISOString(),
        document_count: updatedFolder._count.documents,
        subfolder_count: updatedFolder._count.children
      }
    });

  } catch (error) {
    console.error('❌ Rename folder error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'No token provided' || error.message === 'User not found') {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      
      // Handle JWT errors
      if (error.name === 'JsonWebTokenError') {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
      
      if (error.name === 'TokenExpiredError') {
        return NextResponse.json({ error: 'Token expired' }, { status: 401 });
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to rename folder',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}