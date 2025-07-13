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
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId }
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
      where: { ownerId: user.id },
      include: {
        chatSessions: {
          select: {
            id: true,
            createdAt: true
          }
        }
      },
      orderBy: { uploadedAt: 'desc' }
    });

    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      filename: doc.fileName,
      originalName: doc.originalFileName,
      size: doc.fileSize,
      mimeType: doc.mimeType,
      status: doc.status.toLowerCase(),
      pageCount: doc.pageCount,
      uploadedAt: doc.uploadedAt.toISOString(),
      chatSessionsCount: doc.chatSessions.length,
      lastChatAt: doc.chatSessions.length > 0 
        ? Math.max(...doc.chatSessions.map(s => s.createdAt.getTime()))
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
        ownerId: user.id
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
        userId: user.id,
        action: 'DOCUMENT_DELETE',
        details: `Deleted document: ${document.originalFileName}`,
        ipAddress: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
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