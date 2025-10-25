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
    
    // ✅ FIXED: Return consistent user object with id field
    return {
      id: payload.userId || payload.id,
      email: payload.email,
      name: payload.name
    };
  } catch (error) {
    console.error('Token verification error:', error);
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
    
    console.log(`📚 Loading recent ${limit} chat sessions for user ID: ${user.id}, Email: ${user.email}`);
    
    const chatSessions = await prisma.chatSession.findMany({
      where: { 
        user_id: user.id // ✅ FIXED: Ensure strict user filtering
      },
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

    console.log(`✅ Found ${chatSessions.length} recent chat sessions for user ${user.id}`);
    
    // ✅ FIXED: Log session details to verify correct user filtering
    if (chatSessions.length > 0) {
      console.log(`📋 Session user IDs: ${chatSessions.map(s => s.user_id).join(', ')}`);
    }

    const formattedSessions = chatSessions.map(session => ({
      id: session.id,
      title: session.title,
      documentId: session.document_id,
      documentName: session.document?.file_name || session.document?.original_file_name || 'Unknown Document',
      lastMessage: session.messages[0]?.content || null,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      isSaved: session.is_saved,
      messageCount: session.messages.length,
      userId: session.user_id, // ✅ FIXED: Include userId in response for debugging
    }));

    console.log(`📤 Returning ${formattedSessions.length} sessions for user ${user.id}`);
    return NextResponse.json(formattedSessions);
  } catch (error) {
    console.error('Error fetching recent chat sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent chat sessions' },
      { status: 500 }
    );
  }
}

