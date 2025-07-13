// /backend/api/chat-messages/bulk/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /backend/api/chat-messages/bulk
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, messages } = body;

    if (!sessionId || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Session ID and messages array are required' },
        { status: 400 }
      );
    }

    // Use a transaction to ensure all messages are saved or none are
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing messages for this session to avoid duplicates
      await tx.chatMessage.deleteMany({
        where: { sessionId }
      });

      // Create all messages
      const savedMessages = await Promise.all(
        messages.map((message: any) =>
          tx.chatMessage.create({
            data: {
              id: message.id,
              sessionId,
              role: message.role,
              content: message.content,
              createdAt: new Date(message.timestamp),
              tokensUsed: message.tokensUsed
            }
          })
        )
      );

      // Update session's updatedAt timestamp
      await tx.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() }
      });

      return savedMessages;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error bulk saving chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to bulk save chat messages' },
      { status: 500 }
    );
  }
}