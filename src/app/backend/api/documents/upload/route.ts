// src/app/backend/api/documents/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

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

// Helper function to save file
async function saveFile(file: File): Promise<{ filePath: string; fileName: string }> {
  const uploadDir = path.join(process.cwd(), 'uploads');
  
  // Create uploads directory if it doesn't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const fileName = `${uuidv4()}_${file.name}`;
  const filePath = path.join(uploadDir, fileName);
  
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);
  
  return { filePath, fileName };
}

export async function POST(request: NextRequest) {
  try {
    // Get user from token
    const user = await getUserFromToken(request);

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    // Save file to disk
    const { filePath, fileName } = await saveFile(file);

    // Create document record in database
    const document = await prisma.document.create({
      data: {
        file_name: fileName,
        original_file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        status: 'UPLOADED',
        owner_id: user.id
      }
    });

    // Log security event
    await prisma.securityLog.create({
      data: {
        user_id: user.id,
        action: 'DOCUMENT_UPLOAD',
        details: `Uploaded document: ${file.name}`,
        ip_address: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    });

    // TODO: Process the document with your RAG pipeline
    // For now, we'll just update the status to INDEXED
    await prisma.document.update({
      where: { id: document.id },
      data: { 
        status: 'TEMPORARY',
        page_count: 1 // You'll get this from your RAG processing
      }
    });

    return NextResponse.json({
      documentId: document.id,
      file_name: document.file_name,
      original_name: document.original_file_name,
      size: document.file_size,
      uploaded_at: document.uploaded_at.toISOString(),
      pages_processed: document.page_count || 1
    });

  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' }, 
      { status: 500 }
    );
  }
}