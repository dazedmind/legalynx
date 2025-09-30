// src/app/backend/api/documents/[id]/rename/route.ts
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

// PATCH /backend/api/documents/[id]/rename - Rename document
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(request);
    const documentId = (await params).id;
    const { newName, updateProcessedName } = await request.json();

    console.log('📝 Rename document request:', {
      documentId,
      newName,
      userId: user.id
    });

    // Validate input
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
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

    // Find the document and verify ownership
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        owner_id: user.id
      }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check if name is actually different
    if (document.file_name === trimmedName) {
      return NextResponse.json({ 
        message: 'Document name unchanged',
        document: {
          id: document.id,
          originalFileName: document.file_name,
          fileName: document.file_name
        }
      });
    }

    // Check if a document with the same name already exists in the same folder
    const existingDocument = await prisma.document.findFirst({
      where: {
        file_name: trimmedName,
        folder_id: document.folder_id,
        owner_id: user.id,
        id: { not: documentId } // Exclude current document
      }
    });

    if (existingDocument) {
      return NextResponse.json({ 
        error: 'A document with this name already exists in this location' 
      }, { status: 409 });
    }

    // Check if this is a RAG processing update
    const isRagUpdate = updateProcessedName === true;
    
    const updateData: any = {
      updated_at: new Date()
    };
    
    if (isRagUpdate) {
      // RAG processing update: update file_name (intelligent filename)
      updateData.file_name = trimmedName;
    } else {
      updateData.file_name = trimmedName;
    }
    
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: updateData,
      select: {
        id: true,
        file_name: true,
        status: true,
        uploaded_at: true,
        updated_at: true
      }
    });

    console.log('✅ Document renamed successfully:', {
      documentId,
      oldName: document.file_name,
      newName: trimmedName
    });

    return NextResponse.json({
      success: true,
      message: 'Document renamed successfully',
      document: {
        id: updatedDocument.id,
        fileName: updatedDocument.file_name,
        status: updatedDocument.status,
        uploadedAt: updatedDocument.uploaded_at.toISOString(),
        updatedAt: updatedDocument.updated_at.toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Rename document error:', error);
    
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
        error: 'Failed to rename document',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}