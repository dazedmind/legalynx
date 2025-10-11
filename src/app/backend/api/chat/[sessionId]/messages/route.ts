// src/app/backend/api/chat/[sessionId]/messages/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { TokenTracker, estimateTokens } from '@/lib/token-tracker';

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
  params: Promise<{ sessionId: string }>
}

// Add message to chat session
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUserFromToken(request);
    const { sessionId } = await params;
    const { content, role, sourceNodes, tokensUsed } = await request.json();

    console.log('Adding message to session:', sessionId, 'Role:', role);

    // ===== ADD TOKEN CHECK HERE =====
    if (role.toUpperCase() === 'USER') {
      // Estimate tokens for user input
      const estimatedTokens = estimateTokens(content);
      
      // Check if user has enough tokens
      const canUse = await TokenTracker.canUseTokens(user.id, estimatedTokens);
      if (!canUse) {
        return NextResponse.json({ 
          error: 'Token limit exceeded. Please upgrade your plan or wait for monthly reset.' 
        }, { status: 429 });
      }
    }

    // Verify session belongs to user
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        user_id: user.id
      }
    });

    if (!session) {
      console.error('Chat session not found:', sessionId, 'for user:', user.id);
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
    }

    // ✅ FIX: Ensure role is valid enum value
    const validRole = role.toUpperCase();
    if (!['USER', 'ASSISTANT'].includes(validRole)) {
      return NextResponse.json({ 
        error: 'Invalid role. Must be USER or ASSISTANT' 
      }, { status: 400 });
    }

    // Create message with correct field names
    const message = await prisma.chatMessage.create({
      data: {
        session_id: sessionId,
        role: validRole,
        content,
        source_nodes: sourceNodes || null,
        tokens_used: tokensUsed || null
      }
    });

    // ===== ADD TOKEN RECORDING HERE =====
    if (tokensUsed && tokensUsed > 0) {
      // Record actual token usage
      await TokenTracker.useTokens(user.id, tokensUsed, "chat");
    } else if (validRole === 'USER') {
      // If no tokensUsed provided, estimate and record
      const estimatedTokens = estimateTokens(content);
      await TokenTracker.useTokens(user.id, estimatedTokens, "chat");
    }

    // Update session's updatedAt
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { 
        updated_at: new Date()
      }
    });

    console.log('Message created successfully:', message.id);

    return NextResponse.json({
      messageId: message.id,
      content: message.content,
      role: message.role,
      createdAt: message.created_at,
      sourceNodes: message.source_nodes,
      tokensUsed: message.tokens_used
    });

  } catch (error) {
    console.error('Add message error:', error);
    
    // ✅ Better error handling
    if (error instanceof Error) {
      if (error.message.includes('P2002')) {
        return NextResponse.json({ error: 'Duplicate message' }, { status: 409 });
      }
      if (error.message.includes('P2003')) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to add message' }, 
      { status: 500 }
    );
  }
}

// Get messages for a chat session
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUserFromToken(request);
    const { sessionId } = await params;

    // Verify session belongs to user and get messages
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        user_id: user.id  // ✅ Correct field name
      },
      include: {
        messages: {
          orderBy: { created_at: 'asc' }  // ✅ Correct field name
        },
        document: {
          select: {
            id: true,
            file_name: true,
            original_file_name: true,
            file_size: true,
            page_count: true,
            status: true
          }
        }
      }
    });

    if (!session) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
    }

    return NextResponse.json({
      sessionId: session.id,
      title: session.title,
      document: {
        id: session.document.id,
        fileName: session.document.file_name,
        originalFileName: session.document.original_file_name,
        fileSize: session.document.file_size,
        pageCount: session.document.page_count,
        status: session.document.status
      },
      messages: session.messages.map(msg => ({
        id: msg.id,
        role: msg.role.toLowerCase(),        // Convert enum to lowercase for frontend
        content: msg.content,
        sourceNodes: msg.source_nodes,       // ✅ Correct field name
        tokensUsed: msg.tokens_used,         // ✅ Correct field name
        createdAt: msg.created_at,           // ✅ Correct field name
        branches: msg.branches,              // ✅ Include branching data
        current_branch: msg.current_branch   // ✅ Include current branch index
      }))
    });

  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Failed to get messages' }, 
      { status: 500 }
    );
  }
}