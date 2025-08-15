// src/app/backend/api/debug/files/route.ts - Temporary debug route
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

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

// GET /backend/api/debug/files - Debug file storage
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    
    // Get user's documents from database
    const documents = await prisma.document.findMany({
      where: { owner_id: user.id },
      select: {
        id: true,
        file_name: true,
        original_file_name: true,
        file_path: true,
        file_size: true,
        status: true,
        uploaded_at: true
      },
      orderBy: { uploaded_at: 'desc' }
    });

    // Check file system
    const uploadDir = path.join(process.cwd(), 'uploads');
    const userUploadDir = path.join(uploadDir, user.id);

    const debugInfo = {
      user: {
        id: user.id,
        email: user.email
      },
      directories: {
        cwd: process.cwd(),
        uploadDir: {
          path: uploadDir,
          exists: fs.existsSync(uploadDir),
          contents: fs.existsSync(uploadDir) ? fs.readdirSync(uploadDir) : []
        },
        userUploadDir: {
          path: userUploadDir,
          exists: fs.existsSync(userUploadDir),
          contents: fs.existsSync(userUploadDir) ? fs.readdirSync(userUploadDir) : []
        }
      },
      documents: documents.map(doc => ({
        id: doc.id,
        originalFileName: doc.original_file_name,
        fileName: doc.file_name,
        filePath: doc.file_path,
        fileExists: doc.file_path ? fs.existsSync(doc.file_path) : false,
        status: doc.status,
        uploadedAt: doc.uploaded_at
      }))
    };

    return NextResponse.json(debugInfo);

  } catch (error) {
    console.error('Debug files error:', error);
    return NextResponse.json(
      { error: 'Failed to get debug information' },
      { status: 500 }
    );
  }
}