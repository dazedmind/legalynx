// src/app/backend/api/documents/download/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { S3Service } from '@/lib/s3'; // ✅ Using named import as requested

// Helper function to get user from token
async function getUserFromToken(request: NextRequest) {
    try {
      const token = request.headers.get('authorization')?.replace('Bearer ', '');
      if (!token) {
        throw new Error('No token provided');
      }
  
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET not configured');
      }
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
      
      if (!decoded || !decoded.userId) {
        throw new Error('Invalid token payload');
      }
  
      console.log('🔍 Looking for user with ID:', decoded.userId);
  
      // ✅ FIX: Ensure Prisma is connected before querying
      await prisma.$connect();
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });
  
      if (!user) {
        throw new Error('User not found');
      }
  
      console.log('✅ User found:', user.email);
      return user;
  
    } catch (error) {
      console.error('❌ getUserFromToken error:', error);
      
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      }
      
      throw error;
    }
  }

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(request);
    const { id: documentId } = await params;

    // Verify document belongs to user
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        owner_id: user.id
      }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (!document.s3_key) {
      return NextResponse.json({ error: 'Document not stored in S3' }, { status: 400 });
    }

    // Get download method from query params
    const { searchParams } = new URL(request.url);
    const method = searchParams.get('method') || 'direct';

    if (method === 'signed-url') {
      // ✅ FIX: Use correct method name and parameter type
      const signedUrl = await S3Service.getSignedDownloadUrl(document.s3_key, 3600); // 1 hour
      
      return NextResponse.json({
        downloadUrl: signedUrl,
        filename: document.original_file_name,
        expiresIn: 3600
      });
    } else {
      // ✅ FIX: Use correct method name
      const fileData = await S3Service.downloadFile(document.s3_key);

      // Log download event
      await prisma.securityLog.create({
        data: {
          user_id: user.id,
          action: 'DOCUMENT_DOWNLOAD',
          details: `Downloaded document: ${document.original_file_name}`,
          ip_address: request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown'
        }
      });

      // ✅ FIX: Use correct property names from S3DownloadResult interface
      return new NextResponse(fileData.buffer, {
        status: 200,
        headers: {
          'Content-Type': fileData.contentType,
          'Content-Length': fileData.contentLength.toString(),
          'Content-Disposition': `attachment; filename="${document.original_file_name}"`,
          'Cache-Control': 'no-cache',
        },
      });
    }

  } catch (error) {
    console.error('Document download error:', error);
    return NextResponse.json(
      { error: 'Failed to download document' }, 
      { status: 500 }
    );
  }
}