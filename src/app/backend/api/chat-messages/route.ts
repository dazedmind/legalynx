// /backend/api/chat-messages/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /backend/api/chat-messages?sessionId=xxx
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const messages = await prisma.chatMessage.findMany({
      where: { session_id: sessionId },
      orderBy: { created_at: 'asc' }
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat messages' },
      { status: 500 }
    );
  }
}

// POST /backend/api/chat-messages
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, sessionId, role, content, timestamp, tokens_used } = body;

    if (!sessionId || !role || !content) {
      return NextResponse.json(
        { error: 'Session ID, type, and content are required' },
        { status: 400 }
      );
    }

    const message = await prisma.chatMessage.create({
      data: {
        id,
        session_id: sessionId,
        role,
        content,
        created_at: timestamp ? new Date(timestamp) : new Date(),
        tokens_used: tokens_used, 
      }
    });

    // Update session's updatedAt timestamp
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { updated_at: new Date() }
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error creating chat message:', error);
    return NextResponse.json(
      { error: 'Failed to create chat message' },
      { status: 500 }
    );
  }
}