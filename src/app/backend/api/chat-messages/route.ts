// src/app/backend/api/chat-messages/route.ts - FIXED VERSION
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TokenTracker, estimateTokens } from '@/lib/token-tracker';

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
      where: { session_id: sessionId }, // ✅ Correct field name
      orderBy: { created_at: 'asc' }    // ✅ Correct field name
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
    const {
      id,
      sessionId,
      role,
      content,
      // aliases for created time
      timestamp,
      createdAt,
      // aliases for tokens used
      tokens_used,
      tokensUsed,
    } = body || {};

    console.log('Creating message with data:', {
      id,
      sessionId,
      role,
      contentPreview: content?.substring(0, 50),
      createdAt,
      timestamp,
      tokens_used,
      tokensUsed,
    });

    if (!sessionId || !role || !content) {
      return NextResponse.json(
        { error: 'Session ID, role, and content are required' },
        { status: 400 }
      );
    }

    const validRole = String(role).toUpperCase();
    if (!['USER', 'ASSISTANT'].includes(validRole)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be USER or ASSISTANT' },
        { status: 400 }
      );
    }

    // Find session and user for token tracking
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { user: true }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      );
    }

    // Check tokens if it's a user message
    if (validRole === 'USER') {
      const estimatedTokens = estimateTokens(content);
      const canUse = await TokenTracker.canUseTokens(session.user_id, estimatedTokens);
      if (!canUse) {
        return NextResponse.json({ error: 'Token limit exceeded' }, { status: 429 });
      }
    }

    const effectiveCreatedAt = createdAt || timestamp;
    const effectiveTokens = typeof tokensUsed === 'number' ? tokensUsed : tokens_used;

    const message = await prisma.chatMessage.create({
      data: {
        id,
        session_id: sessionId,
        // Cast to Prisma enum
        role: validRole as any,
        content,
        created_at: effectiveCreatedAt ? new Date(effectiveCreatedAt) : new Date(),
        tokens_used: effectiveTokens ?? null,
      }
    });

    // Record token usage
    if (effectiveTokens && effectiveTokens > 0) {
      await TokenTracker.useTokens(session.user_id, effectiveTokens, 'chat');
    } else if (validRole === 'USER') {
      const estimatedTokens = estimateTokens(content);
      await TokenTracker.useTokens(session.user_id, estimatedTokens, 'chat');
    }

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { updated_at: new Date() }
    });

    console.log('Message created successfully:', message.id);
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error creating chat message:', error);
    if (error instanceof Error) {
      if (error.message.includes('P2002')) {
        return NextResponse.json({ error: 'Message with this ID already exists' }, { status: 409 });
      }
      if (error.message.includes('P2003')) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      if (error.message.includes('P2000')) {
        return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
      }
      return NextResponse.json({ error: error.message || 'Failed to create chat message' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to create chat message' }, { status: 500 });
  }
}