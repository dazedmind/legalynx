// src/app/backend/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// Helper function to get user from token
async function getUserFromToken(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return null; // Return null instead of throwing
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    return user;
  } catch (error) {
    console.log('Token verification failed:', error);
    return null; // Return null instead of throwing
  }
}

// Get user's chat sessions
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      // Return empty sessions instead of 401 error
      return NextResponse.json({ 
        sessions: [],
        message: 'No authentication provided'
      });
    }
    
    let chatSessions: any[] = [];
    
    try {
      chatSessions = await prisma.chatSession.findMany({
        where: { user_id: user.id },
        include: {
          document: true,
          messages: {
            take: 1,
            orderBy: { created_at: 'desc' }
          }
        },
        orderBy: { updated_at: 'desc' }
      });
    } catch (dbError) {
      console.log('Database error loading chat sessions:', dbError);
      chatSessions = []; // Fallback to empty array
    }

    const formattedSessions = chatSessions.map(session => ({
      id: session.id,
      title: session.title,
      documentId: session.document_id,
      documentName: session.document?.original_file_name || 'Unknown Document',
      lastMessage: session.messages[0]?.content || null,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      isSaved: session.is_saved
    }));

    return NextResponse.json({ 
      sessions: formattedSessions,
      count: formattedSessions.length
    });

  } catch (error) {
    console.error('Get chat sessions error:', error);
    
    // Always return empty sessions instead of 500 error
    return NextResponse.json({ 
      sessions: [],
      count: 0,
      message: 'Unable to load chat sessions'
    });
  }
}

// Create new chat session
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
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
        title: title || `Chat with ${document.original_file_name}`,
        user_id: user.id,
        document_id: documentId
      },
      include: {
        document: true,
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
      messages: chatSession.messages
    });

  } catch (error) {
    console.error('Chat session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create chat session' }, 
      { status: 500 }
    );
  }
}