// /backend/api/chat-sessions/find/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /backend/api/chat-sessions/find?userId=xxx&documentId=xxx
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const documentId = searchParams.get('documentId');

    if (!userId || !documentId) {
      return NextResponse.json(
        { error: 'User ID and Document ID are required' },
        { status: 400 }
      );
    }

    const session = await prisma.chatSession.findFirst({
      where: {
        userId,
        documentId
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        },
        document: {
          select: {
            id: true,
            fileName: true,
            originalFileName: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'No session found for this user and document' },
        { status: 404 }
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error finding chat session:', error);
    return NextResponse.json(
      { error: 'Failed to find chat session' },
      { status: 500 }
    );
  }
}