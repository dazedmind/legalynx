// src/app/backend/api/documents/route.ts - FIXED VERSION
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

// Get user's documents
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    
    const documents = await prisma.document.findMany({
      where: { owner_id: user.id },
      include: {
        chat_sessions: {
          select: {
            id: true,
            created_at: true
          }
        }
      },
      orderBy: { uploaded_at: 'desc' }
    });

    // 🔥 FIX: Use the exact property names that ChatViewer expects
    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      
      // ✅ FIXED: Use the exact property names ChatViewer expects
      fileName: doc.file_name,
      originalFileName: doc.original_file_name,
      fileSize: doc.file_size,
      pageCount: doc.page_count || 1,  // ✅ Ensure this is never null
      status: doc.status,
      uploadedAt: doc.uploaded_at.toISOString(),
      
      // Additional fields for compatibility
      mimeType: doc.mime_type,
      databaseId: doc.id,  // ✅ Add this for ChatViewer compatibility
      
      // Chat session info
      chatSessionsCount: doc.chat_sessions.length,
      lastChatAt: doc.chat_sessions.length > 0 
        ? Math.max(...doc.chat_sessions.map(s => s.created_at.getTime()))
        : null
    }));

    console.log('📄 Returning documents:', formattedDocuments.length);
    console.log('📋 First document structure:', formattedDocuments[0] ? Object.keys(formattedDocuments[0]) : 'No documents');

    return NextResponse.json({ documents: formattedDocuments });

  } catch (error) {
    console.error('Get documents error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'No token provided' || error.message === 'User not found') {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to get documents' }, 
      { status: 500 }
    );
  }
}

// Delete document (keep your existing implementation)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    console.log(`🗑️ Deleting document ${documentId} for user ${user.id}`);

    // Verify document belongs to user and get all details
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        owner_id: user.id
      }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    console.log(`📄 Found document: ${document.original_file_name} (status: ${document.status})`);

    // Handle S3 deletion based on document status
    let s3DeletionResult = { success: false, reason: 'No S3 file to delete' };

    if (document.status === 'INDEXED' && document.s3_key) {
      // Document is in S3, delete it
      try {
        console.log(`☁️ Deleting from S3: ${document.s3_key}`);
        await S3Service.deleteFile(document.s3_key);
        s3DeletionResult = { success: true, reason: 'Deleted from S3' };
        console.log(`✅ Successfully deleted from S3: ${document.s3_key}`);
      } catch (s3Error) {
        console.error('❌ Failed to delete from S3:', s3Error);
        s3DeletionResult = { 
          success: false, 
          reason: `S3 deletion failed: ${s3Error instanceof Error ? s3Error.message : 'Unknown error'}` 
        };
        // Continue with database deletion even if S3 deletion fails
      }
    } else if (document.status === 'TEMPORARY' && document.file_path) {
      // Document is temporary, delete local file
      try {
        const fs = require('fs');
        if (fs.existsSync(document.file_path)) {
          fs.unlinkSync(document.file_path);
          s3DeletionResult = { success: true, reason: 'Deleted temporary file' };
          console.log(`✅ Deleted temporary file: ${document.file_path}`);
        } else {
          s3DeletionResult = { success: false, reason: 'Temporary file not found (may have expired)' };
        }
      } catch (fileError) {
        console.error('❌ Failed to delete temporary file:', fileError);
        s3DeletionResult = { 
          success: false, 
          reason: `File deletion failed: ${fileError instanceof Error ? fileError.message : 'Unknown error'}` 
        };
      }
    }

    // Delete from database (this will cascade delete chat sessions and messages)
    await prisma.document.delete({
      where: { id: documentId }
    });

    console.log(`✅ Document deleted from database: ${documentId}`);

    // Log security event
    await prisma.securityLog.create({
      data: {
        user_id: user.id,
        action: 'DOCUMENT_DELETE',
        details: `Deleted document: ${document.original_file_name}`,
        ip_address: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({ 
      message: 'Document deleted successfully',
      details: {
        documentId,
        documentName: document.file_name,
        originalFileName: document.original_file_name,
        status: document.status,
        s3Deletion: s3DeletionResult,
        databaseDeleted: true
      }
    });

  } catch (error) {
    console.error('Delete document error:', error);
    
    // Provide specific error messages
    if (error instanceof Error) {
      if (error.message.includes('No token provided') || error.message.includes('User not found')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to delete document' }, 
      { status: 500 }
    );
  }
}