// src/app/backend/api/folders/all/route.ts
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

// GET /backend/api/folders/all - Get all folders for user (for move-to modal)
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);

    console.log('📁 Loading all folders for user:', user.id);

    // Get all folders for the user with document counts
    const folders = await prisma.folder.findMany({
      where: {
        owner_id: user.id
      },
      select: {
        id: true,
        name: true,
        path: true,
        parent_id: true,
        created_at: true,
        updated_at: true,
        // Count documents in this folder
        _count: {
          select: {
            documents: true,
            children: true // subfolder count
          }
        }
      },
      orderBy: [
        { path: 'asc' },
        { name: 'asc' }
      ]
    });

    // Format folders with counts
    const formattedFolders = folders.map(folder => ({
      id: folder.id,
      name: folder.name,
      path: folder.path,
      parent_id: folder.parent_id,
      created_at: folder.created_at.toISOString(),
      updated_at: folder.updated_at.toISOString(),
      document_count: folder._count?.documents || 0,
      subfolder_count: folder._count?.children || 0
    }));

    console.log('📂 Returning all folders:', formattedFolders.length);

    return NextResponse.json({
      success: true,
      folders: formattedFolders
    });

  } catch (error) {
    console.error('❌ Get all folders error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'No token provided' || error.message === 'User not found') {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      
      // Handle JWT errors
      if (error.name === 'JsonWebTokenError') {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
      
      if (error.name === 'TokenExpiredError') {
        return NextResponse.json({ error: 'Token expired' }, { status: 401 });
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to load folders',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}