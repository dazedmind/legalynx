// src/app/backend/api/chat-messages/[messageId]/route.ts
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

interface RouteParams {
  params: Promise<{ messageId: string }>
}

// Update a chat message
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUserFromToken(request);
    const { messageId } = await params;
    const { content, updatedAt, branches, currentBranch } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // Find the message and verify ownership through session
    const message = await prisma.chatMessage.findFirst({
      where: {
        id: messageId,
        session: {
          user_id: user.id
        }
      },
      include: {
        session: true
      }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Only allow editing USER messages
    if (message.role !== 'USER') {
      return NextResponse.json({ error: 'Only user messages can be edited' }, { status: 400 });
    }

    // Update the message
    const updatedMessage = await prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        content: content.trim(),
        created_at: updatedAt ? new Date(updatedAt) : new Date(),
        // Update branching fields if provided
        ...(branches !== undefined && { branches: branches }),
        ...(currentBranch !== undefined && { current_branch: currentBranch }),
      }
    });

    // Update the session's updatedAt timestamp
    await prisma.chatSession.update({
      where: { id: message.session_id },
      data: { updated_at: new Date() }
    });

    return NextResponse.json({
      messageId: updatedMessage.id,
      content: updatedMessage.content,
      role: updatedMessage.role,
      createdAt: updatedMessage.created_at,
      updatedAt: new Date().toISOString(),
      branches: updatedMessage.branches,
      currentBranch: updatedMessage.current_branch,
    });

  } catch (error) {
    console.error('Update message error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('No token provided') || error.message.includes('User not found')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to update message' }, 
      { status: 500 }
    );
  }
}

// Delete a chat message
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUserFromToken(request);
    const { messageId } = await params;

    // Find the message and verify ownership through session
    const message = await prisma.chatMessage.findFirst({
      where: {
        id: messageId,
        session: {
          user_id: user.id
        }
      },
      include: {
        session: true
      }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Delete the message
    await prisma.chatMessage.delete({
      where: { id: messageId }
    });

    // Update the session's updatedAt timestamp
    await prisma.chatSession.update({
      where: { id: message.session_id },
      data: { updated_at: new Date() }
    });

    return NextResponse.json({
      message: 'Message deleted successfully',
      messageId
    });

  } catch (error) {
    console.error('Delete message error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('No token provided') || error.message.includes('User not found')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to delete message' }, 
      { status: 500 }
    );
  }
}