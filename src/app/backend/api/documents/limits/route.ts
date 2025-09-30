import { NextRequest, NextResponse } from 'next/server';
import { DocumentLimitChecker } from '@/lib/document-limits';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

// Get user from token
async function getUserFromToken(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    throw new Error('No token provided');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

// GET /backend/api/documents/limits - Get document limits for current user
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    const limitsInfo = await DocumentLimitChecker.getDocumentLimitsInfo(user.id);
    
    return NextResponse.json({
      success: true,
      ...limitsInfo
    });
    
  } catch (error) {
    console.error('Document limits check error:', error);
    return NextResponse.json(
      { error: 'Failed to check document limits' },
      { status: 500 }
    );
  }
}
