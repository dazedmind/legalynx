// src/app/backend/api/documents/[id]/file/route.ts - Fixed with correct S3Service methods
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { S3Service } from '@/lib/s3'; // ✅ Using named import
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

// GET /backend/api/documents/[id]/file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(request);
    const { id: documentId } = await params; // ✅ FIX: Handle async params

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
        status: true
      }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found or access denied' }, 
        { status: 404 }
      );
    }

    let fileBuffer: Buffer;
    let fileSource = '';

    // Try multiple approaches in order of preference
    try {
      // Method 1: Try S3 first if document is saved/indexed and has S3 key
      if (document.status === 'INDEXED' && (document.s3_key || document.file_path?.startsWith('http'))) {
        const s3Key = document.s3_key || document.file_path;
        
        try {
          console.log(`📁 Attempting S3 retrieval for key: ${s3Key}`);
          // ✅ FIX: Use correct method name and extract buffer from result
          const s3Result = await S3Service.downloadFile(s3Key);
          fileBuffer = s3Result.buffer;
          fileSource = 'S3';
          console.log(`✅ Retrieved from S3, size: ${fileBuffer.length} bytes`);
        } catch (s3Error) {
          console.error('❌ S3 retrieval failed, trying local fallback:', s3Error);
          throw s3Error; // Let it fall through to local file attempt
        }
      } 
      // Method 2: Try local file path
      else if (document.file_path && !document.file_path.startsWith('http')) {
        console.log(`📁 Attempting local file retrieval: ${document.file_path}`);
        
        // Construct full local path - handle both absolute and relative paths
        let fullPath: string;
        if (document.file_path.startsWith('/uploads')) {
          // Relative path from project root
          fullPath = path.join(process.cwd(), document.file_path);
        } else if (path.isAbsolute(document.file_path)) {
          // Already absolute path
          fullPath = document.file_path;
        } else {
          // Relative path, assume it's from project root
          fullPath = path.join(process.cwd(), document.file_path);
        }
        
        console.log(`📂 Full path resolved to: ${fullPath}`);
        
        // Check if file exists
        if (!fs.existsSync(fullPath)) {
          throw new Error(`Local file not found: ${fullPath}`);
        }
        
        fileBuffer = fs.readFileSync(fullPath);
        fileSource = 'LOCAL';
        console.log(`✅ Retrieved from local storage, size: ${fileBuffer.length} bytes`);
      }
      // Method 3: Fallback - try local even if S3 failed
      else {
        throw new Error('No valid file path found');
      }

    } catch (primaryError) {
      console.log('Primary retrieval method failed, trying fallback...');
      
      // Fallback: If S3 failed, try local file path
      if (document.file_path && !document.file_path.startsWith('http')) {
        try {
          console.log(`🔄 Fallback: Attempting local file retrieval: ${document.file_path}`);
          
          // Construct full local path for fallback
          let fullPath: string;
          if (document.file_path.startsWith('/uploads')) {
            // Relative path from project root
            fullPath = path.join(process.cwd(), document.file_path);
          } else if (path.isAbsolute(document.file_path)) {
            // Already absolute path
            fullPath = document.file_path;
          } else {
            // Relative path, assume it's from project root
            fullPath = path.join(process.cwd(), document.file_path);
          }
          
          console.log(`📂 Fallback full path resolved to: ${fullPath}`);
          
          if (fs.existsSync(fullPath)) {
            fileBuffer = fs.readFileSync(fullPath);
            fileSource = 'LOCAL_FALLBACK';
            console.log(`✅ Retrieved from local fallback, size: ${fileBuffer.length} bytes`);
          } else {
            throw new Error(`Fallback file not found: ${fullPath}`);
          }
        } catch (localError) {
          console.error('❌ Local fallback also failed:', localError);
          throw localError;
        }
      } else {
        // No fallback available
        console.error('❌ No fallback available, primary error:', primaryError);
        
        if (primaryError instanceof Error) {
          if (primaryError.message.includes('File not found') || primaryError.message.includes('ENOENT')) {
            return NextResponse.json(
              { 
                error: 'Document file not found',
                details: 'The file may have been moved or deleted from storage'
              }, 
              { status: 404 }
            );
          }
          if (primaryError.message.includes('Access denied') || primaryError.message.includes('EACCES')) {
            return NextResponse.json(
              { error: 'Access denied to document file' }, 
              { status: 403 }
            );
          }
        }
        
        return NextResponse.json(
          { 
            error: 'Failed to retrieve document file',
            details: 'File not accessible from any storage location'
          }, 
          { status: 500 }
        );
      }
    }

    // Determine content type
    const contentType = document.mime_type || 
      (document.original_file_name?.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${document.original_file_name || 'document.pdf'}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
        'X-File-Source': fileSource, // Debug header to see which method worked
        // CORS headers
        'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      }
    });

  } catch (error) {
    console.error('Document file retrieval error:', error);
    
    // Handle specific JWT errors
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve document file',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// Alternative endpoint: /documents/[id]/download - Returns a presigned URL (S3 only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(request);
    const { id: documentId } = await params; // ✅ FIX: Handle async params

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
        s3_key: true,
        file_path: true,
        original_file_name: true,
        status: true
      }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found or access denied' }, 
        { status: 404 }
      );
    }

    // This endpoint only works for S3 stored files
    const s3Key = document.s3_key || (document.file_path?.startsWith('http') ? document.file_path : null);
    
    if (!s3Key) {
      return NextResponse.json(
        { 
          error: 'Presigned URLs only available for cloud-stored documents',
          details: 'Use the GET endpoint for direct file access'
        }, 
        { status: 400 }
      );
    }

    try {
      // ✅ FIX: Use correct method name and parameters
      const presignedUrl = await S3Service.getSignedDownloadUrl(
        s3Key, 
        3600 // 1 hour - this is the correct parameter signature
      );

      return NextResponse.json({
        downloadUrl: presignedUrl,
        filename: document.original_file_name,
        expiresIn: 3600,
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
      });

    } catch (s3Error: any) {
      console.error('S3 Presigned URL Error:', s3Error);
      
      return NextResponse.json(
        { error: 'Failed to generate download link' }, 
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Presigned URL generation error:', error);
    
    return NextResponse.json(
      { error: 'Failed to generate download link' }, 
      { status: 500 }
    );
  }
}