// src/app/backend/api/chat/route.ts
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
        ownerId: user.id
      }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Create chat session
    const chatSession = await prisma.chatSession.create({
      data: {
        title: title || `Chat with ${document.originalFileName}`,
        userId: user.id,
        documentId: documentId
      },
      include: {
        document: true,
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    return NextResponse.json({
      sessionId: chatSession.id,
      title: chatSession.title,
      documentId: chatSession.documentId,
      documentName: chatSession.document.originalFileName,
      createdAt: chatSession.createdAt,
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

// Get user's chat sessions
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    
    const chatSessions = await prisma.chatSession.findMany({
      where: { userId: user.id },
      include: {
        document: true,
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const formattedSessions = chatSessions.map(session => ({
      id: session.id,
      title: session.title,
      documentId: session.documentId,
      documentName: session.document.originalFileName,
      lastMessage: session.messages[0]?.content || null,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      isSaved: session.isSaved
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