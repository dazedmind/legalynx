// /backend/api/chat-sessions/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /backend/api/chat-sessions?userId=xxx&documentId=xxx
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const documentId = searchParams.get('documentId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const whereClause: any = { userId };
    if (documentId) {
      whereClause.documentId = documentId;
    }

    const sessions = await prisma.chatSession.findMany({
      where: whereClause,
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

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat sessions' },
      { status: 500 }
    );
  }
}

// POST /backend/api/chat-sessions
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, documentId, title, isSaved = false } = body;

    if (!userId || !documentId) {
      return NextResponse.json(
        { error: 'User ID and Document ID are required' },
        { status: 400 }
      );
    }

    const session = await prisma.chatSession.create({
      data: {
        userId,
        documentId,
        title,
        isSaved
      },
      include: {
        document: {
          select: {
            id: true,
            fileName: true,
            originalFileName: true
          }
        }
      }
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Error creating chat session:', error);
    return NextResponse.json(
      { error: 'Failed to create chat session' },
      { status: 500 }
    );
  }
}   