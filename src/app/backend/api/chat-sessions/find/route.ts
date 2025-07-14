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
        user_id: userId,
        document_id: documentId
      },
      include: {
        messages: {
          orderBy: { created_at: 'asc' }
        },
        document: {
          select: {
            id: true,
            file_name: true,
            original_file_name: true
          }
        }
      },
      orderBy: { updated_at: 'desc' }
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