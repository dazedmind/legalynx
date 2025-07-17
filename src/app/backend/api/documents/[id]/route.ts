// src/app/backend/api/documents/[id]/route.ts
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

// GET /backend/api/documents/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(request);
    const documentId = params.id;

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    // Get document details and verify ownership
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        owner_id: user.id
      },
      include: {
        chat_sessions: {
          select: {
            id: true,
            title: true,
            created_at: true,
            updated_at: true,
            is_saved: true,
            _count: {
              select: {
                messages: true
              }
            }
          },
          orderBy: {
            updated_at: 'desc'
          }
        }
      }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found or access denied' }, 
        { status: 404 }
      );
    }

    // Format the response
    const formattedDocument = {
      id: document.id,
      filename: document.file_name,
      originalName: document.original_file_name,
      size: document.file_size,
      mimeType: document.mime_type,
      status: document.status.toLowerCase(),
      pageCount: document.page_count,
      uploadedAt: document.uploaded_at.toISOString(),
      updatedAt: document.updated_at.toISOString(),
      chatSessions: document.chat_sessions.map(session => ({
        id: session.id,
        title: session.title,
        messageCount: session._count.messages,
        isSaved: session.is_saved,
        createdAt: session.created_at.toISOString(),
        updatedAt: session.updated_at.toISOString()
      })),
      totalChatSessions: document.chat_sessions.length,
      totalMessages: document.chat_sessions.reduce((sum, session) => sum + session._count.messages, 0)
    };

    return NextResponse.json(formattedDocument);

  } catch (error) {
    console.error('Document details error:', error);
    
    // Handle specific JWT errors
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Failed to get document details' }, 
      { status: 500 }
    );
  }
}

// DELETE /backend/api/documents/[id] - Delete specific document
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(request);
    const documentId = params.id;

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    // Verify document belongs to user and get details
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        owner_id: user.id
      }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete document (this will cascade delete chat sessions and messages)
    await prisma.document.delete({
      where: { id: documentId }
    });

    // Clean up physical file if it exists
    if (document.file_path) {
      try {
        const fs = require('fs');
        if (fs.existsSync(document.file_path)) {
          fs.unlinkSync(document.file_path);
          console.log(`Deleted physical file: ${document.file_path}`);
        }
      } catch (fileError) {
        console.error('Error deleting physical file:', fileError);
        // Don't fail the request if file cleanup fails
      }
    }

    return NextResponse.json({ 
      message: 'Document deleted successfully',
      deletedDocument: {
        id: document.id,
        name: document.original_file_name
      }
    });

  } catch (error) {
    console.error('Delete document error:', error);
    
    // Handle specific Prisma errors
    if (error instanceof Error && error.message.includes('P2025')) {
      return NextResponse.json(
        { error: 'Document not found or already deleted' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete document' }, 
      { status: 500 }
    );
  }
}