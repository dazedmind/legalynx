// src/app/backend/api/documents/status/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// Helper function to get user from token with better error handling
async function getUserFromToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new Error('Invalid authorization header format');
    }

    const token = authHeader.replace('Bearer ', '').trim();
    
    if (!token) {
      throw new Error('No token provided');
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    // Log token info for debugging (remove in production)
    console.log('Token length:', token.length);
    console.log('Token starts with:', token.substring(0, 20) + '...');

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
    
    if (!decoded.userId) {
      throw new Error('Token missing userId');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      console.error('JWT Error details:', {
        name: error.name,
        message: error.message,
        tokenLength: request.headers.get('authorization')?.length || 0
      });
      throw new Error(`JWT verification failed: ${error.message}`);
    }
    throw error;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== Document Status Check ===');
    console.log('Document ID:', (await params).id);
    console.log('Auth header present:', !!request.headers.get('authorization'));

    const user = await getUserFromToken(request);
    const { id: documentId } = await params;

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    console.log('User ID:', user.id);
    console.log('Looking for document:', documentId);

    // Find document belonging to user
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        owner_id: user.id
      },
      select: {
        id: true,
        original_file_name: true,
        file_size: true,
        status: true,
        page_count: true,
        uploaded_at: true,
        updated_at: true,
        s3_key: true,
        s3_bucket: true,
        file_path: true
      }
    });

    console.log('Document found:', !!document);
    console.log('Document status:', document?.status);

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Calculate processing progress based on status
    const getProgressInfo = (status: string) => {
      switch (status) {
        case 'UPLOADED':
          return {
            progress: 25,
            stage: 'uploaded',
            message: 'File uploaded, waiting for processing...',
            canDownload: false,
            inS3: false
          };
        case 'PROCESSING':
          return {
            progress: 50,
            stage: 'processing',
            message: 'Processing document with AI...',
            canDownload: false,
            inS3: false
          };
        case 'PROCESSED':
          return {
            progress: 75,
            stage: 'processed',
            message: 'Processing complete, uploading to cloud storage...',
            canDownload: false,
            inS3: false
          };
        case 'INDEXED':
          return {
            progress: 100,
            stage: 'completed',
            message: 'Document ready for use',
            canDownload: true,
            inS3: true
          };
        case 'FAILED':
          return {
            progress: 0,
            stage: 'failed',
            message: 'Processing failed. Please try uploading again.',
            canDownload: false,
            inS3: false
          };
        case 'TEMPORARY':
          return {
            progress: 100,
            stage: 'temporary',
            message: 'Document ready (session only)',
            canDownload: false,
            inS3: false
          };
        default:
          return {
            progress: 0,
            stage: 'unknown',
            message: 'Unknown status',
            canDownload: false,
            inS3: false
          };
      }
    };

    const progressInfo = getProgressInfo(document.status);

    // Calculate processing time
    const uploadTime = new Date(document.uploaded_at);
    const updateTime = new Date(document.updated_at);
    const processingTimeMs = updateTime.getTime() - uploadTime.getTime();

    const response = {
      document: {
        id: document.id,
        originalFileName: document.original_file_name,
        fileSize: document.file_size,
        status: document.status,
        pageCount: document.page_count,
        uploadedAt: document.uploaded_at,
        updatedAt: document.updated_at,
        hasS3Storage: !!document.s3_key,
        s3Url: document.file_path || null
      },
      progress: {
        percentage: progressInfo.progress,
        stage: progressInfo.stage,
        message: progressInfo.message,
        canDownload: progressInfo.canDownload,
        inCloudStorage: progressInfo.inS3
      },
      timing: {
        uploadedAt: uploadTime.toISOString(),
        lastUpdated: updateTime.toISOString(),
        processingTimeSeconds: Math.round(processingTimeMs / 1000),
        isRecent: processingTimeMs < 300000 // Less than 5 minutes
      }
    };

    console.log('Sending response:', {
      documentId: response.document.id,
      status: response.document.status,
      progress: response.progress.percentage
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Document status check error:', error);
    
    // Return specific error messages
    if (error instanceof Error) {
      if (error.message.includes('JWT verification failed')) {
        return NextResponse.json(
          { error: 'Authentication failed. Please sign in again.' },
          { status: 401 }
        );
      }
      if (error.message.includes('No authorization header') || error.message.includes('No token provided')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      if (error.message.includes('User not found')) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to check document status' }, 
      { status: 500 }
    );
  }
}