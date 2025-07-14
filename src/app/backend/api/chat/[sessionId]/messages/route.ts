// src/app/backend/api/chat/[sessionId]/messages/route.ts
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

interface RouteParams {
  params: { sessionId: string }
}

// Add message to chat session
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUserFromToken(request);
    const { sessionId } = params;
    const { content, role, sourceNodes, tokensUsed } = await request.json();

    // Verify session belongs to user
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        user_id: user.id
      }
    });

    if (!session) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
    }

    // Create message
    const message = await prisma.chatMessage.create({
      data: {
        session_id: sessionId,
        role: role.toUpperCase(), // USER or ASSISTANT
        content,
        source_nodes: sourceNodes || null,
        tokens_used: tokensUsed || null
      }
    });

    // Update session's updatedAt
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { updated_at: new Date() }
    });

    return NextResponse.json({
      messageId: message.id,
      content: message.content,
      role: message.role,
      createdAt: message.created_at,
      sourceNodes: message.source_nodes,
      tokensUsed: message.tokens_used
    });

  } catch (error) {
    console.error('Add message error:', error);
    return NextResponse.json(
      { error: 'Failed to add message' }, 
      { status: 500 }
    );
  }
}

// Get messages for a chat session
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUserFromToken(request);
    const { sessionId } = params;

    // Verify session belongs to user
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        user_id: user.id
      },
      include: {
        messages: {
          orderBy: { created_at: 'asc' }
        },
        document: true
      }
    });

    if (!session) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
    }

    return NextResponse.json({
      sessionId: session.id,
      title: session.title,
      document: {
        id: session.document.id,
        name: session.document.original_file_name,
        size: session.document.file_size,
        pages: session.document.page_count
      },
      messages: session.messages.map(msg => ({
        id: msg.id,
        role: msg.role.toLowerCase(),
        content: msg.content,
        sourceNodes: msg.source_nodes,
        tokensUsed: msg.tokens_used,
        createdAt: msg.created_at
      }))
    });

  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Failed to get messages' }, 
      { status: 500 }
    );
  }
}