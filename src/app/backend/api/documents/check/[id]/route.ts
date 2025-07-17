// src/app/backend/api/documents/check/[id]/route.ts
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

// GET /backend/api/documents/check/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(request);
    const documentId = params.id;

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    // Check if document exists and belongs to user
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        owner_id: user.id
      },
      select: {
        id: true,
        status: true,
        original_file_name: true
      }
    });

    if (!document) {
      return NextResponse.json(
        { 
          exists: false, 
          error: 'Document not found or access denied' 
        }, 
        { status: 404 }
      );
    }

    // Document exists
    return NextResponse.json({
      exists: true,
      id: document.id,
      status: document.status,
      name: document.original_file_name
    });

  } catch (error) {
    console.error('Document check error:', error);
    
    // Handle specific JWT errors
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      return NextResponse.json({ exists: false, error: 'Invalid token' }, { status: 401 });
    }
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      return NextResponse.json({ exists: false, error: 'Token expired' }, { status: 401 });
    }
    
    return NextResponse.json(
      { 
        exists: false, 
        error: 'Failed to check document existence' 
      }, 
      { status: 500 }
    );
  }
}