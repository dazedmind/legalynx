// src/app/backend/api/chat/route.ts - Updated to include file paths
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

// Create new chat session
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    const { documentId, title } = await request.json();

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

    // Create chat session
    const chatSession = await prisma.chatSession.create({
      data: {
        title: title || `Chat with ${document.file_name}`,
        user_id: user.id,
        document_id: documentId
      },
      include: {
        document: {
          select: {
            id: true,
            file_name: true,
            original_file_name: true,
            file_path: true, // Include file path
            file_size: true,
            page_count: true,
            mime_type: true,
            status: true
          }
        },
        messages: {
          orderBy: { created_at: 'asc' }
        }
      }
    });

    return NextResponse.json({
      sessionId: chatSession.id,
      title: chatSession.title,
      documentId: chatSession.document_id,
      documentName: chatSession.document.original_file_name,
      createdAt: chatSession.created_at,
      messages: chatSession.messages,
      document: {
        id: chatSession.document.id,
        filename: chatSession.document.file_name,
        originalFileName: chatSession.document.original_file_name,
        filePath: chatSession.document.file_path, // Include file path
        size: chatSession.document.file_size,
        pages: chatSession.document.page_count,
        mimeType: chatSession.document.mime_type,
        status: chatSession.document.status
      }
    });

  } catch (error) {
    console.error('Chat session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create chat session' }, 
      { status: 500 }
    );
  }
}

// Get user's chat sessions - UPDATED to include file paths
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    
    const chatSessions = await prisma.chatSession.findMany({
      where: { user_id: user.id },
      include: {
        document: {
          select: {
            id: true,
            file_name: true,
            original_file_name: true,
            file_path: true, // ✅ Include file path
            file_size: true,
            page_count: true,
            mime_type: true,
            status: true
          }
        },
        messages: {
          take: 1,
          orderBy: { created_at: 'desc' }
        }
      },
      orderBy: { updated_at: 'desc' }
    });

    const formattedSessions = chatSessions.map(session => ({
      id: session.id,
      title: session.title,
      documentId: session.document_id,
      documentName: session.document.original_file_name,
      lastMessage: session.messages[0]?.content || null,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      isSaved: session.is_saved,
      document: {
        id: session.document.id,
        fileName: session.document.file_name,
        originalFileName: session.document.original_file_name,
        filePath: session.document.file_path, // ✅ Include file path
        fileSize: session.document.file_size,
        pageCount: session.document.page_count,
        mimeType: session.document.mime_type,
        status: session.document.status
      }
    }));

    return NextResponse.json({ sessions: formattedSessions });

  } catch (error) {
    console.error('Get chat sessions error:', error);
    return NextResponse.json(
      { error: 'Failed to get chat sessions' }, 
      { status: 500 }
    );
  }
}