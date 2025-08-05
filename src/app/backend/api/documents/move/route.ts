// src/app/backend/api/documents/move/route.ts
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

// POST /backend/api/documents/move - Move document(s) to folder
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    const { documentIds, targetFolderId } = await request.json();
    
    console.log('📁 Move documents request:', {
      documentIds: documentIds?.length || 0,
      targetFolderId,
      userId: user.id
    });

    // Validate input
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: 'Document IDs are required' }, { status: 400 });
    }

    // Validate target folder if specified (null means move to root)
    let targetFolder = null;
    if (targetFolderId) {
      targetFolder = await prisma.folder.findFirst({
        where: { 
          id: targetFolderId, 
          owner_id: user.id 
        }
      });
      
      if (!targetFolder) {
        return NextResponse.json({ error: 'Target folder not found' }, { status: 404 });
      }
      console.log('📂 Target folder:', targetFolder.name);
    } else {
      console.log('📂 Moving to root folder');
    }

    // Verify all documents belong to user and get current folder info
    const documents = await prisma.document.findMany({
      where: {
        id: { in: documentIds },
        owner_id: user.id
      },
      select: {
        id: true,
        original_file_name: true,
        folder_id: true,
        folder: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (documents.length !== documentIds.length) {
      return NextResponse.json({ 
        error: 'Some documents not found or access denied',
        found: documents.length,
        requested: documentIds.length
      }, { status: 404 });
    }

    console.log('📄 Documents to move:', documents.map(d => ({
      name: d.original_file_name,
      currentFolder: d.folder?.name || 'Root',
      targetFolder: targetFolder?.name || 'Root'
    })));

    // Check if any documents are already in the target folder
    const alreadyInTarget = documents.filter(doc => 
      doc.folder_id === targetFolderId
    );

    if (alreadyInTarget.length > 0) {
      console.log('⚠️ Some documents already in target folder:', alreadyInTarget.length);
      // Continue anyway - this isn't an error, just log it
    }

    // Update documents to new folder
    const updateResult = await prisma.document.updateMany({
      where: {
        id: { in: documentIds },
        owner_id: user.id
      },
      data: {
        folder_id: targetFolderId,
        updated_at: new Date()
      }
    });

    console.log('✅ Documents moved successfully:', {
      updated: updateResult.count,
      targetFolder: targetFolder?.name || 'Root'
    });

    // Get updated document info for response
    const updatedDocuments = await prisma.document.findMany({
      where: {
        id: { in: documentIds }
      },
      select: {
        id: true,
        original_file_name: true,
        folder_id: true,
        folder: {
          select: {
            id: true,
            name: true,
            path: true
          }
        }
      }
    });

    // Update folder document counts
    const affectedFolderIds = new Set<string>();
    
    // Add source folders
    documents.forEach(doc => {
      if (doc.folder_id) {
        affectedFolderIds.add(doc.folder_id);
      }
    });
    
    // Add target folder
    if (targetFolderId) {
      affectedFolderIds.add(targetFolderId);
    }

    // Update document counts for affected folders
    for (const folderId of affectedFolderIds) {
      const documentCount = await prisma.document.count({
        where: {
          folder_id: folderId,
          owner_id: user.id
        }
      });

      await prisma.folder.update({
        where: { id: folderId },
        data: { 
          updated_at: new Date()
        }
      });
    }

    console.log('📊 Updated folder counts for', affectedFolderIds.size, 'folders');

    return NextResponse.json({
      success: true,
      message: `Successfully moved ${updateResult.count} document${updateResult.count !== 1 ? 's' : ''}`,
      moved_count: updateResult.count,
      target_folder: targetFolder ? {
        id: targetFolder.id,
        name: targetFolder.name
      } : null,
      documents: updatedDocuments
    });

  } catch (error) {
    console.error('❌ Move documents error:', error);
    
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
        error: 'Failed to move documents',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// GET /backend/api/documents/move - Get move status (optional endpoint for checking move history)
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Get document with folder info
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        owner_id: user.id
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            path: true,
            parent_id: true
          }
        }
      }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Build folder breadcrumbs if document is in a folder
    let breadcrumbs: { id: string; name: string }[] = [];
    
    if (document.folder) {
      const buildBreadcrumbs = async (folderId: string): Promise<{ id: string; name: string }[]> => {
        const folder = await prisma.folder.findUnique({
          where: { id: folderId },
          select: { id: true, name: true, parent_id: true }
        });
        
        if (!folder) return [];
        
        const crumbs = [{ id: folder.id, name: folder.name }];
        
        if (folder.parent_id) {
          const parentCrumbs = await buildBreadcrumbs(folder.parent_id);
          return [...parentCrumbs, ...crumbs];
        }
        
        return crumbs;
      };
      
      breadcrumbs = await buildBreadcrumbs(document.folder.id);
    }

    return NextResponse.json({
      document: {
        id: document.id,
        fileName: document.original_file_name,
        folderId: document.folder_id,
        folder: document.folder,
        breadcrumbs,
        lastMoved: document.updated_at
      }
    });

  } catch (error) {
    console.error('❌ Get move status error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'No token provided' || error.message === 'User not found') {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to get document move status' }, 
      { status: 500 }
    );
  }
}