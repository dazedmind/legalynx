// src/app/backend/api/chat-sessions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// Helper function to get user from token
async function getUserFromToken(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    throw new Error('No token provided');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

// GET /backend/api/chat-sessions/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(request);
    const sessionId = params.id;

    const chatSession = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        user_id: user.id // Ensure user owns this session
      },
      include: {
        document: {
          select: {
            id: true,
            file_name: true,
            original_file_name: true,
            file_size: true,
            page_count: true
          }
        },
        messages: {
          orderBy: { created_at: 'asc' }
        }
      }
    });

    if (!chatSession) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(chatSession);
  } catch (error) {
    console.error('Error fetching chat session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat session' },
      { status: 500 }
    );
  }
}

// PATCH /backend/api/chat-sessions/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(request);
    const sessionId = params.id;
    const body = await request.json();

    // Verify session belongs to user
    const existingSession = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        user_id: user.id
      }
    });

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      );
    }

    // Update the session
    const updatedSession = await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        title: body.title,
        is_saved: body.isSaved,
        updated_at: body.updatedAt ? new Date(body.updatedAt) : new Date()
      }
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Error updating chat session:', error);
    return NextResponse.json(
      { error: 'Failed to update chat session' },
      { status: 500 }
    );
  }
}

// DELETE /backend/api/chat-sessions/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(request);
    const sessionId = params.id;

    // Verify session belongs to user
    const chatSession = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        user_id: user.id
      }
    });

    if (!chatSession) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      );
    }

    // Use a transaction to delete messages first, then the session
    await prisma.$transaction(async (tx) => {
      // Delete all messages associated with this session
      await tx.chatMessage.deleteMany({
        where: { session_id: sessionId }
      });

      // Delete the chat session
      await tx.chatSession.delete({
        where: { id: sessionId }
      });
    });

    // Log security event (optional)
    try {
      await prisma.securityLog.create({
        data: {
          user_id: user.id,
          action: 'CHAT_DELETE',
          details: `Deleted chat session: ${chatSession.title || sessionId}`,
          ip_address: request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown'
        }
      });
    } catch (logError) {
      // Don't fail the deletion if logging fails
      console.warn('Failed to log security event:', logError);
    }

    return NextResponse.json({ 
      message: 'Chat session deleted successfully',
      sessionId 
    });

  } catch (error) {
    console.error('Error deleting chat session:', error);
    
    // Handle specific Prisma errors
    if (error instanceof Error && error.message.includes('P2025')) {
      return NextResponse.json(
        { error: 'Chat session not found or already deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete chat session' },
      { status: 500 }
    );
  }
}