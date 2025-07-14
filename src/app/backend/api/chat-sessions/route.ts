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

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat sessions' },
      { status: 500 }
    );
  }
}


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

    // Check if a session already exists for this user and document
    const existingSession = await prisma.chatSession.findFirst({
      where: {
        user_id: userId,
        document_id: documentId
      },
      include: {
        document: {
          select: {
            id: true,
            file_name: true,
            original_file_name: true
          }
        }
      }
    });

    if (existingSession) {
      // Return the existing session instead of creating a new one
      return NextResponse.json(existingSession);
    }

    // Create new session only if none exists
    const session = await prisma.chatSession.create({
      data: {
        user_id: userId,
        document_id: documentId,
        title,
        is_saved: isSaved
      },
      include: {
        document: {
          select: {
            id: true,
            file_name: true,
            original_file_name: true
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