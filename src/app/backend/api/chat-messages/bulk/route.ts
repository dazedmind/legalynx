// Fixed /backend/api/chat-messages/bulk/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    console.log(`Bulk saving ${messages.length} messages for session ${sessionId}`);

    // Use a transaction to ensure all messages are saved or none are
    const result = await prisma.$transaction(async (tx) => {
      // Get existing message IDs to avoid duplicates
      const existingMessages = await tx.chatMessage.findMany({
        where: { sessionId },
        select: { id: true }
      });
      
      const existingIds = new Set(existingMessages.map(msg => msg.id));
      
      // Filter out messages that already exist
      const newMessages = messages.filter((message: any) => !existingIds.has(message.id));
      
      console.log(`Found ${existingMessages.length} existing messages, adding ${newMessages.length} new messages`);

      if (newMessages.length === 0) {
        console.log('No new messages to save');
        return [];
      }

      // Create only new messages
      const savedMessages = await Promise.all(
        newMessages.map((message: any) =>
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

    return NextResponse.json({
      saved: result.length,
      message: `Successfully saved ${result.length} new messages`
    });
  } catch (error) {
    console.error('Error bulk saving chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to bulk save chat messages' },
      { status: 500 }
    );
  }
}