// src/app/backend/api/documents/[id]/file/route.ts - Updated for AWS S3
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { S3Service } from '@/lib/s3';

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
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(request);
    const documentId = params.id;

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
        file_path: true, // This should contain the S3 key
        s3_key: true,    // Dedicated S3 key field if you have one
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

    // Determine S3 key - use dedicated field or file_path
    const s3Key = document.s3_key || document.file_path;
    
    if (!s3Key) {
      console.log(`No S3 key found for document: ${document.id}`);
      return NextResponse.json(
        { error: 'Document file location not found' }, 
        { status: 404 }
      );
    }

    try {
      // Method 1: Stream the file directly through your API (more secure)
      // This bypasses CORS issues since the file comes through your API
      const fileBuffer = await S3Service.getFileBuffer(s3Key);


      // Return the file with appropriate headers
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': document.mime_type || 'application/pdf',
          'Content-Disposition': `attachment; filename="${document.original_file_name}"`,
          'Content-Length': fileBuffer.length.toString(),
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          // Add CORS headers to prevent issues
          'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        }
      });

    } catch (s3Error: any) {
      console.error('S3 Error:', s3Error);
      
      // Handle specific S3 errors using our utility class
      if (s3Error.message.includes('File not found')) {
        return NextResponse.json(
          { error: 'Document file not found in storage' }, 
          { status: 404 }
        );
      }
      
      if (s3Error.message.includes('Access denied')) {
        return NextResponse.json(
          { error: 'Access denied to document file' }, 
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to retrieve document file from storage' }, 
        { status: 500 }
      );
    }

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
      { error: 'Failed to retrieve document file' }, 
      { status: 500 }
    );
  }
}

// Alternative endpoint: /documents/[id]/download - Returns a presigned URL
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(request);
    const documentId = params.id;

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

    const s3Key = document.s3_key || document.file_path;
    
    if (!s3Key) {
      return NextResponse.json(
        { error: 'Document file location not found' }, 
        { status: 404 }
      );
    }

    try {
      // Generate presigned URL valid for 1 hour using our utility
      const presignedUrl = await S3Service.getPresignedDownloadUrl(
        s3Key, 
        document.original_file_name, 
        3600 // 1 hour
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