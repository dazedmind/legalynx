// src/app/backend/api/documents/[id]/file/route.ts - Updated with query token support
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

// Helper function to get user from token (supports both header and query)
async function getUserFromToken(request: NextRequest) {
  // Try to get token from Authorization header first
  let token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  // If no header token, try query parameter (for iframe compatibility)
  if (!token) {
    const { searchParams } = new URL(request.url);
    token = searchParams.get('token') || '';
  }

  if (!token) {
    throw new Error('No token provided');
  }

  console.log('🔍 Token found:', token ? `${token.substring(0, 20)}...` : 'MISSING');

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  console.log('✅ User authenticated:', user.email);
  return user;
}

// GET /backend/api/documents/[id]/file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    console.log('📥 PDF file request for document:', resolvedParams.id);
    
    const user = await getUserFromToken(request);
    const documentId = resolvedParams.id;

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    // Get document details and verify ownership
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        owner_id: user.id
      },
      select: {
        id: true,
        file_path: true,
        s3_key: true,
        file_name: true,
        original_file_name: true,
        mime_type: true,
        status: true,
        file_size: true
      }
    });

    if (!document) {
      console.log('❌ Document not found or access denied');
      return NextResponse.json(
        { 
          error: 'Document not found or access denied',
          details: 'Document may not exist or you do not have permission to view it'
        }, 
        { status: 404 }
      );
    }

    console.log('📄 Document found:', {
      id: document.id,
      filename: document.original_file_name,
      status: document.status,
      hasS3Key: !!document.s3_key,
      hasFilePath: !!document.file_path
    });

    let fileBuffer: Buffer = Buffer.alloc(0);
    let fileSource = '';

    // Try multiple approaches to get the file (S3 first, then fallback)
    try {
      // Method 1: Try S3 first (primary storage)
      if (document.s3_key) {
        console.log('☁️ Trying S3 file:', document.s3_key);
        try {
          // Import S3Service dynamically
          const { S3Service } = await import('@/lib/s3');
          const s3Result = await S3Service.downloadFile(document.s3_key);
          fileBuffer = Buffer.from(s3Result.buffer);
          fileSource = `S3: ${document.s3_key}`;
          console.log(`✅ Retrieved from S3, size: ${fileBuffer.length} bytes`);
        } catch (s3Error) {
          console.log('❌ S3 access failed:', s3Error);
          throw s3Error;
        }
      }
      // Method 2: Try local file system as fallback
      else if (document.file_path && !document.file_path.startsWith('http')) {
        console.log('📁 Trying local file path:', document.file_path);
        
        let fullPath = document.file_path;
        
        // Handle relative paths
        if (!path.isAbsolute(fullPath)) {
          fullPath = path.join(process.cwd(), fullPath);
        }
        
        if (fs.existsSync(fullPath)) {
          fileBuffer = fs.readFileSync(fullPath);
          fileSource = `Local file: ${fullPath}`;
          console.log(`✅ Retrieved from local file, size: ${fileBuffer.length} bytes`);
        } else {
          throw new Error(`Local file not found: ${fullPath}`);
        }
      } else {
        throw new Error('No S3 key or local file path available');
      }
    } catch (primaryError) {
      console.log('⚠️ Primary storage access failed:', primaryError);
      
      // Method 3: Try common upload locations as last resort
      const possiblePaths = [
        path.join(process.cwd(), 'uploads', user.id, document.file_name),
        path.join(process.cwd(), 'uploads', document.file_name),
        path.join(process.cwd(), 'uploads', document.original_file_name),
      ];

      let found = false;
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          fileBuffer = fs.readFileSync(testPath);
          fileSource = `Fallback: ${testPath}`;
          console.log(`✅ Retrieved from fallback location, size: ${fileBuffer.length} bytes`);
          found = true;
          break;
        }
      }

      if (!found) {
        console.error('❌ File not found in any location');
        return NextResponse.json(
          { 
            error: 'Document file not found',
            details: `The file may have been moved or deleted from storage. Document status: ${document.status}, S3 key: ${document.s3_key || 'none'}, File path: ${document.file_path || 'none'}`
          }, 
          { status: 404 }
        );
      }
    }

    // Determine content type
    const contentType = document.mime_type || 
      (document.original_file_name?.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');

    console.log(`📤 Serving file: ${fileSource}, size: ${fileBuffer.length}, type: ${contentType}`);

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${document.original_file_name || 'document.pdf'}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'private, max-age=3600',
        'X-File-Source': fileSource,
        // CORS headers for iframe compatibility
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      }
    });

  } catch (error) {
    console.error('❌ Document file retrieval error:', error);
    
    // Handle specific JWT errors
    if (error instanceof Error && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
      return NextResponse.json({ 
        error: 'Authentication failed', 
        details: 'Invalid or expired token'
      }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes('No token provided')) {
      return NextResponse.json({ 
        error: 'Authentication required', 
        details: 'No token provided'
      }, { status: 401 });
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve document file',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      }, 
      { status: 500 }
    );
  }
}