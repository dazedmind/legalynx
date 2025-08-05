// src/app/api/folders/[id]/route.ts
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

// DELETE /api/folders/[id] - Delete folder
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(request);
    const folderId = (await params).id;
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true'; // Check if forced deletion

    if (!folderId) {
      return NextResponse.json({ error: 'Folder ID is required' }, { status: 400 });
    }

    // Check if folder exists and belongs to user
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, owner_id: user.id },
      include: {
        children: {
          include: {
            _count: {
              select: {
                documents: true,
                children: true
              }
            }
          }
        },
        documents: true,
        _count: {
          select: {
            documents: true,
            children: true
          }
        }
      }
    });

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // If folder has contents and force is not specified, return info for confirmation
    if ((folder.children.length > 0 || folder.documents.length > 0) && !force) {
      return NextResponse.json({ 
        requiresConfirmation: true,
        folder: {
          id: folder.id,
          name: folder.name,
          documentCount: folder._count.documents,
          subfolderCount: folder._count.children,
          hasDocuments: folder.documents.length > 0,
          hasSubfolders: folder.children.length > 0,
          subfolders: folder.children.map(child => ({
            id: child.id,
            name: child.name,
            documentCount: child._count.documents,
            subfolderCount: child._count.children
          }))
        }
      }, { status: 409 }); // 409 Conflict - requires user decision
    }

    // If force is true, delete recursively
    if (force) {
      await deleteRecursively(folderId, user.id);
    } else {
      // Safe delete (folder should be empty at this point)
      await prisma.folder.delete({
        where: { id: folderId }
      });
    }

    return NextResponse.json({
      message: 'Folder deleted successfully',
      deletedFolder: {
        id: folder.id,
        name: folder.name
      }
    });

  } catch (error) {
    console.error('Delete folder error:', error);
    
    if (error instanceof Error && error.message.includes('JWT')) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes('P2025')) {
      return NextResponse.json({ error: 'Folder not found or already deleted' }, { status: 404 });
    }
    
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 });
  }
}

// Helper function to delete folder and all its contents recursively
async function deleteRecursively(folderId: string, userId: string) {
  // Get folder with all children
  const folder = await prisma.folder.findFirst({
    where: { id: folderId, owner_id: userId },
    include: {
      children: true,
      documents: true
    }
  });

  if (!folder) return;

  // Delete all child folders recursively
  for (const child of folder.children) {
    await deleteRecursively(child.id, userId);
  }

  // Delete all documents in this folder
  if (folder.documents.length > 0) {
    await prisma.document.deleteMany({
      where: { 
        folder_id: folderId,
        owner_id: userId 
      }
    });
  }

  // Finally delete the folder itself
  await prisma.folder.delete({
    where: { id: folderId }
  });
}