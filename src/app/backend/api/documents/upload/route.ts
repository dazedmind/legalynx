// src/app/backend/api/documents/upload/route.ts - Fixed path handling
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

// Helper function to normalize path for storage (always use forward slashes)
function normalizePathForStorage(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

// Helper function to save file to disk
async function saveFileToDisk(file: File, userId: string): Promise<{ filePath: string; fileName: string; storagePath: string }> {
  // Create uploads directory structure: uploads/userId/
  const baseUploadDir = path.join(process.cwd(), 'uploads');
  const userUploadDir = path.join(baseUploadDir, userId);
  
  // Create directories if they don't exist
  if (!fs.existsSync(baseUploadDir)) {
    fs.mkdirSync(baseUploadDir, { recursive: true });
    console.log('📁 Created base upload directory:', baseUploadDir);
  }
  
  if (!fs.existsSync(userUploadDir)) {
    fs.mkdirSync(userUploadDir, { recursive: true });
    console.log('📁 Created user upload directory:', userUploadDir);
  }

  // Generate unique filename to avoid conflicts
  const fileExtension = path.extname(file.name);
  const baseName = path.basename(file.name, fileExtension);
  const uniqueFileName = `${baseName}_${uuidv4()}${fileExtension}`;
  const filePath = path.join(userUploadDir, uniqueFileName);
  
  // Create a storage path that's normalized for cross-platform compatibility
  const storagePath = normalizePathForStorage(filePath);
  
  console.log('💾 Saving file:');
  console.log('  - Original name:', file.name);
  console.log('  - Unique name:', uniqueFileName);
  console.log('  - Full path:', filePath);
  console.log('  - Storage path:', storagePath);
  
  // Convert file to buffer and save
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);
  
  // Verify file was saved
  if (!fs.existsSync(filePath)) {
    throw new Error('Failed to save file to disk');
  }
  
  const savedFileSize = fs.statSync(filePath).size;
  console.log('✅ File saved successfully. Size:', savedFileSize, 'bytes');
  
  return { 
    filePath: filePath, // Actual system path for immediate use
    fileName: uniqueFileName,
    storagePath: storagePath // Normalized path for database storage
  };
}

export async function POST(request: NextRequest) {
  try {
    // Get user from token
    const user = await getUserFromToken(request);
    console.log('👤 User authenticated:', user.email);

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    console.log('📄 Processing file:', file.name, 'Size:', file.size);

    // Save file to disk
    const { filePath, fileName, storagePath } = await saveFileToDisk(file, user.id);

    // Create document record in database with normalized storage path
    const document = await prisma.document.create({
      data: {
        file_name: fileName,
        original_file_name: file.name,
        file_path: storagePath, // ✅ Store normalized path
        file_size: file.size,
        mime_type: file.type,
        status: 'UPLOADED', // Start with UPLOADED status
        owner_id: user.id
      }
    });

    console.log('📋 Document record created:');
    console.log('  - ID:', document.id);
    console.log('  - File path in DB:', document.file_path);

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

    // TODO: Process the document with your RAG pipeline here
    // For now, update status to indicate it's ready
    await prisma.document.update({
      where: { id: document.id },
      data: { 
        status: 'TEMPORARY', // Mark as ready for use
        page_count: 1 // You'll get this from your RAG processing
      }
    });

    console.log('✅ Document upload completed successfully');

    return NextResponse.json({
      documentId: document.id,
      filename: document.file_name,
      originalName: document.original_file_name,
      size: document.file_size,
      uploadedAt: document.uploaded_at.toISOString(),
      pages_processed: document.page_count || 1,
      status: 'TEMPORARY'
    });

  } catch (error) {
    console.error('❌ Document upload error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'No token provided') {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      if (error.message === 'User not found') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to upload document' }, 
      { status: 500 }
    );
  }
}