// /backend/api/chat-sessions/recent/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

async function getUserFromToken(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No authorization token');
    }

    const token = authHeader.substring(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    return payload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// GET /backend/api/chat-sessions/recent?limit=3
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    
    // Get limit from query params, default to 3
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '3', 10);
    
    console.log(`📚 Loading recent ${limit} chat sessions for user: ${user.id}`);
    
    const chatSessions = await prisma.chatSession.findMany({
      where: { user_id: user.id },
      include: {
        document: {
          select: {
            id: true,
            file_name: true,
            original_file_name: true,
            file_size: true,
            page_count: true,
            status: true
          }
        },
        messages: {
          take: 1,
          orderBy: { created_at: 'desc' }
        }
      },
      orderBy: { updated_at: 'desc' },
      take: limit // Only get the most recent N sessions
    });

    console.log(`✅ Found ${chatSessions.length} recent chat sessions`);

    const formattedSessions = chatSessions.map(session => ({
      id: session.id,
      title: session.title,
      documentId: session.document_id,
      documentName: session.document?.original_file_name || session.document?.file_name || 'Unknown Document',
      lastMessage: session.messages[0]?.content || null,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      isSaved: session.is_saved,
      messageCount: session.messages.length,
    }));

    return NextResponse.json(formattedSessions);
  } catch (error) {
    console.error('Error fetching recent chat sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent chat sessions' },
      { status: 500 }
    );
  }
}

