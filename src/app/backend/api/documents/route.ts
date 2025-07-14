// src/app/backend/api/documents/route.ts
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
  
  // ✅ FIX: Use 'userId' from JWT payload, not 'user_id'
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId } // Changed from decoded.user_id to decoded.userId
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

// Get user's documents
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    
    const documents = await prisma.document.findMany({
      where: { owner_id: user.id },
      include: {
        chat_sessions: {
          select: {
            id: true,
            created_at: true
          }
        }
      },
      orderBy: { uploaded_at: 'desc' }
    });

    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      filename: doc.file_name,
      originalName: doc.original_file_name,
      size: doc.file_size,
      mimeType: doc.mime_type,
      status: doc.status.toLowerCase(),
      pageCount: doc.page_count,
      uploadedAt: doc.uploaded_at.toISOString(),
      chatSessionsCount: doc.chat_sessions.length,
      lastChatAt: doc.chat_sessions.length > 0 
        ? Math.max(...doc.chat_sessions.map(s => s.created_at.getTime()))
        : null
    }));

    return NextResponse.json({ documents: formattedDocuments });

  } catch (error) {
    console.error('Get documents error:', error);
    return NextResponse.json(
      { error: 'Failed to get documents' }, 
      { status: 500 }
    );
  }
}

// Delete document
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    // Verify document belongs to user
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

    // Log security event
    await prisma.securityLog.create({
      data: {
        user_id: user.id,
        action: 'DOCUMENT_DELETE',
        details: `Deleted document: ${document.original_file_name}`,
        ip_address: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({ message: 'Document deleted successfully' });

  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' }, 
      { status: 500 }
    );
  }
}