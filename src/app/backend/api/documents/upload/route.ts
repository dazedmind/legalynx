// src/app/backend/api/documents/upload/route.ts - CORRECTED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

// Helper function to get user from token
async function getUserFromToken(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    throw new Error('No token provided');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
  
  console.log('🔍 Debug - JWT decoded:', { userId: decoded.userId });
  console.log('🔍 Debug - Prisma client state:', { 
    hasUser: typeof prisma.user !== 'undefined' ? 'User model exists' : 'User model missing'
  });

  // Try to ensure connection is established
  try {
    await prisma.$connect();
    console.log('✅ Database connection established');
  } catch (connectError) {
    console.error('❌ Database connection failed:', connectError);
    throw new Error('Database connection failed');
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

// Helper function to save file temporarily for RAG processing
async function saveFileTemporarily(file: File, documentId: string): Promise<string> {
  const tempDir = path.join(process.cwd(), 'temp');
  
  // Ensure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const tempFilePath = path.join(tempDir, `${documentId}.pdf`);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(tempFilePath, buffer);
  
  return tempFilePath;
}

// Helper function to process with RAG pipeline
async function processWithRAGPipeline(tempFilePath: string): Promise<any> {
  try {
    console.log('🔄 Processing with RAG pipeline...');
    
    // Call your existing RAG pipeline upload endpoint
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(tempFilePath);
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    formData.append('file', blob, path.basename(tempFilePath));
    
    const ragResponse = await fetch('http://localhost:8000/upload-pdf', {
      method: 'POST',
      body: formData
    });
    
    if (!ragResponse.ok) {
      throw new Error(`RAG processing failed: ${ragResponse.statusText}`);
    }
    
    const result = await ragResponse.json();
    console.log('✅ RAG processing successful:', result);
    
    return {
      success: true,
      pages_processed: result.pages_processed || 1,
      filename: result.filename,
      message: result.message
    };
    
  } catch (error) {
    console.error('❌ RAG processing error:', error);
    throw new Error(`RAG processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to clean up temporary file
function cleanupTempFile(filePath: string) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Cleaned up temp file: ${filePath}`);
    }
  } catch (error) {
    console.error('Error cleaning up temp file:', error);
  }
}

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null;
  let documentRecord: any = null;
  
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

    // Check file size (e.g., 50MB limit)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 50MB limit' }, { status: 400 });
    }

    // Generate unique document ID
    const documentId = uuidv4();

    console.log(`📄 Starting upload process for ${file.name} (${documentId})`);

    // Step 1: Save file temporarily for RAG processing
    tempFilePath = await saveFileTemporarily(file, documentId);
    console.log(`💾 File saved temporarily: ${tempFilePath}`);

    // Step 2: Process with RAG pipeline FIRST
    console.log(`🔄 Processing with RAG pipeline...`);
    const ragResult = await processWithRAGPipeline(tempFilePath);

    if (!ragResult.success) {
      throw new Error('RAG processing failed');
    }

    console.log(`✅ RAG processing completed successfully`);

    // Step 3: Create document record with TEMPORARY status (not in cloud yet)
    console.log('🔍 Debug - About to create document record...');
    try {
      documentRecord = await prisma.document.create({
      data: {
        id: documentId,
        file_name: file.name, // Store original filename
        original_file_name: file.name,
        file_path: tempFilePath, // Store temp path for now
        s3_key: null, // No S3 yet
        s3_bucket: null, // No S3 yet
        file_size: file.size,
        mime_type: file.type,
        status: 'TEMPORARY', // 🔑 KEY: Status is TEMPORARY, not INDEXED
        page_count: ragResult.pages_processed,
        owner_id: user.id,
        processing_completed_at: new Date()
      }
    });
    console.log('✅ Document record created successfully');
    } catch (createError) {
      console.error('❌ Document creation failed:', createError);
      throw createError;
    }

    // Step 4: Log security event
    await prisma.securityLog.create({
      data: {
        user_id: user.id,
        action: 'DOCUMENT_UPLOAD',
        details: `Document processed with RAG: ${file.name} (${ragResult.pages_processed} pages)`,
        ip_address: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    });

    // Step 5: Clean up temporary file after a delay (keep it briefly for potential Save action)
    setTimeout(() => {
      if (tempFilePath) cleanupTempFile(tempFilePath);
    }, 30000); // Keep for 30 seconds

    console.log(`✅ Document upload complete: ${documentId} (TEMPORARY status)`);

    return NextResponse.json({
      documentId: documentRecord.id,
      filename: ragResult.filename,
      original_name: documentRecord.original_file_name,
      size: documentRecord.file_size,
      uploaded_at: documentRecord.uploaded_at.toISOString(),
      pages_processed: documentRecord.page_count,
      status: documentRecord.status, // Will be 'TEMPORARY'
      ragResult: {
        processed: true,
        pages: ragResult.pages_processed,
        filename: ragResult.filename
      }
    });

  } catch (error) {
    console.error('Document upload error:', error);
    
    // Clean up on error
    if (tempFilePath) {
      cleanupTempFile(tempFilePath);
    }
    
    // Update document status to FAILED if record was created
    if (documentRecord) {
      try {
        await prisma.document.update({
          where: { id: documentRecord.id },
          data: { 
            status: 'FAILED',
            updated_at: new Date()
          }
        });
      } catch (updateError) {
        console.error('Failed to update document status to FAILED:', updateError);
      }
    }
    
    // Return appropriate error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    if (errorMessage.includes('RAG processing')) {
      return NextResponse.json(
        { error: 'Document processing failed. Please try again with a different document.' }, 
        { status: 422 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to upload document' }, 
      { status: 500 }
    );
  }
}