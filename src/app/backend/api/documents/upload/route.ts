import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { StorageTracker } from '@/lib/storage-tracker';

// Just add this helper function to communicate with your FastAPI backend
async function processWithRAGBackend(file: File, userToken: string) {
  const formData = new FormData();
  formData.append('file', file);
  
  const ragBackendUrl = 'http://localhost:8000'; // Your existing FastAPI URL
  
  try {
    const response = await fetch(`${ragBackendUrl}/upload-pdf`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${userToken}`,
      },
    });

    if (response.ok) {
      return await response.json();
    } else {
      console.warn('RAG backend failed, proceeding with original naming');
      return null;
    }
  } catch (error) {
    console.warn('RAG backend not available:', error);
    return null;
  }
}

// Your existing getUserFromToken function stays the same
async function getUserFromToken(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    throw new Error('No token provided');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: {
      user_settings: true // Include user settings
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

// Update your existing saveFileToDisk function
async function saveFileToDisk(
  file: File, 
  userId: string, 
  intelligentName?: string
): Promise<{ filePath: string; fileName: string; cutFilePath: string }> {
  const baseUploadDir = path.join(process.cwd(), 'uploads');
  const userUploadDir = path.join(baseUploadDir, userId);
  
  if (!fs.existsSync(baseUploadDir)) {
    fs.mkdirSync(baseUploadDir, { recursive: true });
  }
  
  if (!fs.existsSync(userUploadDir)) {
    fs.mkdirSync(userUploadDir, { recursive: true });
  }

  // Use intelligent name if provided, otherwise generate unique name
  let finalFileName: string;
  
  if (intelligentName && intelligentName !== file.name) {
    finalFileName = intelligentName;
    console.log('🧠 Using intelligent filename:', finalFileName);
  } else {
    const fileExtension = path.extname(file.name);
    const baseName = path.basename(file.name, fileExtension);
    finalFileName = `${baseName}_${uuidv4()}${fileExtension}`;
    console.log('📁 Using fallback filename:', finalFileName);
  }
  
  const filePath = path.join(userUploadDir, finalFileName);
  const cutFilePath = cutToUploadsOnly(filePath);
  
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);
  
  if (!fs.existsSync(filePath)) {
    throw new Error('Failed to save file to disk');
  }
  
  return { 
    filePath: filePath,
    fileName: finalFileName,
    cutFilePath: cutFilePath
  };
}

function cutToUploadsOnly(fullPath: string): string {
  const idx = fullPath.toLowerCase().indexOf('uploads');
  return idx !== -1 ? fullPath.slice(idx).replace(/\//g, '\\') : fullPath;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    console.log('👤 User authenticated:', user.email);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const intelligentFilename = formData.get('intelligent_filename') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Support both PDF and DOCX
    const supportedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!supportedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Only PDF and DOCX files are allowed' 
      }, { status: 400 });
    }

    // ===== ADD STORAGE CHECK HERE =====
    const canUpload = await StorageTracker.canUploadFile(user.id, file.size);
    if (!canUpload) {
      return NextResponse.json({ 
        error: 'Storage limit exceeded. Please delete some files or upgrade your plan.' 
      }, { status: 413 }); // 413 = Payload Too Large
    }

    console.log('📄 Processing file:', file.name);

    let finalFilename = file.name;
    let pageCount = null;

    // ✅ FIXED: Use intelligent filename if provided by frontend (from RAG response)
    if (intelligentFilename && intelligentFilename.trim()) {
      finalFilename = intelligentFilename;
      console.log('✅ Using intelligent filename from RAG system:', finalFilename);
    } else {
      // Fallback: Try to get intelligent filename from RAG backend
      console.log('🧠 No intelligent filename provided, attempting RAG backend communication...');
      
      try {
        const userToken = request.headers.get('authorization')?.replace('Bearer ', '') || '';
        const ragResponse = await processWithRAGBackend(file, userToken);
        
        if (ragResponse && ragResponse.filename !== ragResponse.original_filename) {
          finalFilename = ragResponse.filename;
          pageCount = ragResponse.pages_processed || null;
          console.log('✅ Got intelligent filename from RAG backend:', finalFilename);
        } else {
          console.log('ℹ️ RAG backend returned original filename');
        }
      } catch (ragError) {
        console.log('RAG backend failed, proceeding with original naming');
        console.error('RAG communication error:', ragError);
      }
    }

    console.log('📁 Using final filename:', finalFilename);

    // Save file to S3 for persistent storage
    let s3Key = '';
    let s3Url = '';
    
    try {
      console.log('☁️ Uploading file to S3...');
      const { S3Service } = await import('@/lib/s3');
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      
      const s3Result = await S3Service.uploadFile(
        fileBuffer,
        finalFilename,
        file.type,
        user.id,
        'documents'
      );
      
      s3Key = s3Result.key;
      s3Url = s3Result.url;
      
      console.log('✅ File uploaded to S3:', {
        key: s3Key,
        size: s3Result.size
      });
    } catch (s3Error) {
      console.error('❌ S3 upload failed:', s3Error);
      // Continue without S3 - document will still be created but file won't be accessible
    }

    // Determine status based on whether file was successfully stored
    const documentStatus = s3Key ? 'UPLOADED' : 'TEMPORARY';
    
    // Create document record with S3 storage info
    const document = await prisma.document.create({
      data: {
        file_name: finalFilename,
        original_file_name: file.name,
        file_path: s3Url || '', // S3 URL for file access, empty if S3 failed
        s3_key: s3Key || null, // S3 key for direct access, null if S3 failed
        file_size: file.size,
        mime_type: file.type,
        status: 'TEMPORARY',
        page_count: pageCount,
        owner_id: user.id
      }
    });

    await StorageTracker.updateStorageUsage(user.id);
    console.log('✅ Document uploaded and saved:', document.id);


    console.log('📋 Document created with intelligent naming');

    // Log security event
    await prisma.securityLog.create({
      data: {
        user_id: user.id,
        action: 'DOCUMENT_UPLOAD',
        details: `Uploaded: ${file.name} → ${finalFilename}`,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    });

    // ✅ FIXED: Return the exact structure that ChatViewer expects
    return NextResponse.json({
      documentId: document.id,
      fileName: document.file_name,           // This should now be the intelligent filename
      originalFileName: document.original_file_name,
      fileSize: document.file_size,
      pageCount: document.page_count,
      status: document.status,
      uploadedAt: document.uploaded_at,
      mimeType: document.mime_type,
      s3Key: document.s3_key,
      filePath: document.file_path,
      storageStatus: s3Key ? 'S3_STORED' : 'STORAGE_FAILED'
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}