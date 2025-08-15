// src/app/backend/api/chat-sessions/route.ts - IMPROVED VERSION
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// Helper function to get user from token
async function getUserFromToken(request: Request) {
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

// GET /backend/api/chat-sessions
export async function GET(request: Request) {
  try {
    const user = await getUserFromToken(request);
    
    console.log(`📚 Loading chat sessions for user: ${user.id}`);
    
    const chatSessions = await prisma.chatSession.findMany({
      where: { user_id: user.id },
      include: {
        document: {
          select: {
            id: true,
            file_name: true,
            original_file_name: true,
            file_size: true,
            page_count: true,
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

    console.log(`✅ Found ${chatSessions.length} chat sessions`);

    const formattedSessions = chatSessions.map(session => ({
      id: session.id,
      title: session.title,
      documentId: session.document_id,
      documentName: session.document.original_file_name,
      lastMessage: session.messages[0]?.content || null,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      isSaved: session.is_saved,
      messageCount: session.messages.length,
      document: {
        id: session.document.id,
        fileName: session.document.file_name,
        originalFileName: session.document.original_file_name,
        fileSize: session.document.file_size,
        pageCount: session.document.page_count,
        status: session.document.status
      }
    }));

    return NextResponse.json({ sessions: formattedSessions });
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat sessions' },
      { status: 500 }
    );
  }
}

// POST /backend/api/chat-sessions - Create new session
export async function POST(request: Request) {
  try {
    const user = await getUserFromToken(request);
    const body = await request.json();
    const { documentId, title, isSaved = false } = body;

    console.log('📝 Creating new chat session:', { documentId, title, isSaved });

    // Validate required fields
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // ✅ Check if document exists and belongs to user
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        owner_id: user.id
      }
    });

    if (!document) {
      console.error(`❌ Document not found: ${documentId} for user: ${user.id}`);
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      );
    }

    // ✅ Check if session already exists for this user+document
    const existingSession = await prisma.chatSession.findFirst({
      where: {
        user_id: user.id,
        document_id: documentId
      },
      include: {
        document: {
          select: {
            id: true,
            file_name: true,
            original_file_name: true
          }
        },
        messages: {
          orderBy: { created_at: 'asc' }
        }
      }
    });

    if (existingSession) {
      console.log(`✅ Returning existing session: ${existingSession.id}`);
      return NextResponse.json(existingSession);
    }

    // ✅ Create new session
    const session = await prisma.chatSession.create({
      data: {
        user_id: user.id,
        document_id: documentId,
        title: title || `Chat with ${document.file_name}`,
        is_saved: isSaved
      },
      include: {
        document: {
          select: {
            id: true,
            file_name: true,
            original_file_name: true,
            file_size: true,
            page_count: true,
            status: true
          }
        },
        messages: {
          orderBy: { created_at: 'asc' }
        }
      }
    });

    console.log(`✅ Created new session: ${session.id}`);

    return NextResponse.json(session, { status: 201 });
    
  } catch (error) {
    console.error('Error creating chat session:', error);
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('P2002')) {
        return NextResponse.json(
          { error: 'Chat session already exists for this document' },
          { status: 409 }
        );
      }
      if (error.message.includes('P2003')) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create chat session' },
      { status: 500 }
    );
  }
}

// DELETE /backend/api/chat-sessions - Delete chat session
export async function DELETE(request: Request) {
  try {
    const user = await getUserFromToken(request);
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // ✅ Verify session belongs to user
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        user_id: user.id
      }
    });

    if (!session) {
      return NextResponse.json({ 
        message: 'Session not found or already deleted' 
      }, { status: 200 }); // Return success even if not found
    }

    // ✅ Use transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Delete all messages for this session first
      await tx.chatMessage.deleteMany({
        where: { session_id: sessionId }
      });

      // Then delete the chat session
      await tx.chatSession.delete({
        where: { id: sessionId }
      });
    });

    console.log(`✅ Deleted session: ${sessionId}`);

    return NextResponse.json({ 
      message: 'Chat session deleted successfully',
      sessionId 
    });

  } catch (error) {
    console.error('Error deleting chat session:', error);
    return NextResponse.json(
      { error: 'Failed to delete chat session' },
      { status: 500 }
    );
  }
}