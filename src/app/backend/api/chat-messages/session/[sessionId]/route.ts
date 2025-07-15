// /backend/api/chat-messages/session/[sessionId]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE /backend/api/chat-messages/session/[sessionId]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    // Delete all messages for this session
    const result = await prisma.chatMessage.deleteMany({
      where: { session_id: sessionId }
    });

    // Update session's updatedAt timestamp
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { updated_at: new Date() }
    });

    return NextResponse.json({
      message: 'Messages deleted successfully',
      deletedCount: result.count
    });
  } catch (error) {
    console.error('Error deleting chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to delete chat messages' },
      { status: 500 }
    );
  }
}