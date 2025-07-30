// src/app/backend/api/documents/save-document/route.ts - Fixed to use RAG filename
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { S3Service } from '@/lib/s3';
import fs from 'fs';
import { StorageTracker } from '@/lib/storage-tracker';

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

// ✅ FIXED: Helper function to upload document to S3 using RAG-generated filename
async function saveDocumentToS3(document: any): Promise<any> {
  try {
    console.log(`☁️ Uploading document to S3: ${document.original_file_name}`);
    
    // Check if temporary file still exists
    if (!document.file_path || !fs.existsSync(document.file_path)) {
      throw new Error('Temporary file not found. Please re-upload the document.');
    }
    
    const buffer = fs.readFileSync(document.file_path);
    
    // ✅ FIXED: Use RAG-generated filename (file_name) if available, fallback to original
    const ragGeneratedFilename = document.file_name; // This is the RAG-generated filename
    const originalFilename = document.original_file_name; // This is the user's original filename
    
    // Use RAG filename if it's different from original (meaning RAG processed it)
    const preferredFilename = (ragGeneratedFilename && ragGeneratedFilename !== originalFilename) 
      ? ragGeneratedFilename 
      : originalFilename;
    
    console.log(`📝 Filename choice:`, {
      original: originalFilename,
      ragGenerated: ragGeneratedFilename,
      preferred: preferredFilename
    });
    
    const contentType = document.mime_type || 'application/pdf';
    
    // Clean up the preferred filename - preserve the intelligent naming
    const cleanFileName = preferredFilename
      .replace(/[^a-zA-Z0-9.-_]/g, '_') // Replace special chars with underscore but keep underscores
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .substring(0, 150); // Increase limit to preserve full intelligent names
    
    // ✅ FIXED: Create S3 key using user_id/filename structure to preserve RAG naming
    const s3Key = `documents/${document.owner_id}/${cleanFileName}`;
    
    console.log(`📁 S3 Key: ${s3Key}`);
    console.log(`🪣 Target Bucket: legalynx`);
    console.log(`🎯 Preserving RAG intelligent filename: ${cleanFileName}`);
    
    let s3Result: any;
    
    try {
        // Method 1: Try the uploadFile method with proper parameters
        if (typeof S3Service.uploadFile === 'function') {
          console.log('🔄 Attempting S3Service.uploadFile...');
          s3Result = await S3Service.uploadFile(
            buffer, 
            cleanFileName, 
            contentType, 
            document.owner_id,
            'documents'
          );
        }
        // Method 2: Try upload method
        else if (typeof (S3Service as any).upload === 'function') {
          console.log('🔄 Attempting S3Service.upload...');
          s3Result = await (S3Service as any).upload({
            Key: s3Key,
            Body: buffer,
            ContentType: contentType,
            Bucket: 'legalynx'
          });
        }
        // Method 3: Try putObject method
        else if (typeof (S3Service as any).putObject === 'function') {
          console.log('🔄 Attempting S3Service.putObject...');
          s3Result = await (S3Service as any).putObject({
            Key: s3Key,
            Body: buffer,
            ContentType: contentType,
            Bucket: 'legalynx'
          });
        }
        else {
          throw new Error('No compatible S3 upload method found in S3Service');
        }
    } catch (uploadError) {
      console.error('❌ S3 upload method failed:', uploadError);
      throw new Error(`S3 upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
    }
    
    // Normalize s3Result properties with proper S3 key and bucket
    const normalizedResult = {
      key: s3Result?.key || s3Result?.Key || s3Key,
      bucket: s3Result?.bucket || s3Result?.Bucket || 'legalynx',
      url: s3Result?.url || s3Result?.location || s3Result?.Location || 
           `https://legalynx.s3.amazonaws.com/${s3Key}`,
      etag: s3Result?.etag || s3Result?.ETag || 'unknown',
      size: buffer.length
    };
    
    console.log(`✅ Document uploaded to S3 with RAG filename:`, normalizedResult);
    console.log(`📍 Final S3 Location: s3://legalynx/${s3Key}`);
    
    // ✅ FIXED: Update document record with S3 information but preserve RAG filename
    const updatedDocument = await prisma.document.update({
      where: { id: document.id },
      data: {
        // Keep the original file_name (RAG-generated) for database consistency
        file_name: ragGeneratedFilename || normalizedResult.key,
        file_path: normalizedResult.url, // Update path to S3 URL
        s3_key: normalizedResult.key,    // Store S3 key for reference
        s3_bucket: 'legalynx',
        status: 'INDEXED',
        s3_uploaded_at: new Date(),
        updated_at: new Date()
      }
    });
    
    // Clean up temporary file
    try {
      fs.unlinkSync(document.file_path);
      console.log(`🗑️ Cleaned up temp file: ${document.file_path}`);
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp file:', cleanupError);
    }
    
    return updatedDocument;
    
  } catch (error) {
    console.error('❌ S3 upload error:', error);
    throw new Error(`Failed to save to cloud storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromToken(request);
        const body = await request.json();
        
        // ✅ FIXED: Accept both field names for compatibility
        const documentId = body.documentId || body.document_id;
        const title = body.title;
        
        if (!documentId) {
            return NextResponse.json({ 
                error: 'Document ID is required' 
            }, { status: 400 });
        }

        console.log(`💾 Saving document ${documentId} for user ${user.id}`);

        // Find the document with TEMPORARY status
        const document = await prisma.document.findFirst({
            where: { 
                id: documentId,
                owner_id: user.id,
                status: 'TEMPORARY' // Only save documents that are temporary
            }
        });

        if (!document) {
            return NextResponse.json({ 
                error: 'Document not found or already saved' 
            }, { status: 404 });
        }

        console.log(`📄 Found document:`, {
          original: document.original_file_name,
          ragGenerated: document.file_name,
          status: document.status
        });

        // Upload to S3 and update status to INDEXED
        const savedDocument = await saveDocumentToS3(document);

        await StorageTracker.updateStorageUsage(user.id);

        // Log security event (optional - only if securityLog table exists)
        try {
            await prisma.securityLog.create({
                data: {
                    user_id: user.id,
                    action: 'DOCUMENT_UPLOAD',
                    details: `Saved document to cloud storage: ${document.original_file_name} → ${document.file_name}`,
                    ip_address: request.headers.get('x-forwarded-for') || 
                              request.headers.get('x-real-ip') || 
                              'unknown',
                    user_agent: request.headers.get('user-agent') || 'unknown'
                }
            });
        } catch (logError) {
            console.warn('Failed to log security event (table may not exist):', logError);
        }

        console.log(`✅ Document saved successfully with RAG filename preserved:`, {
          id: savedDocument.id,
          filename: savedDocument.file_name,
          s3Key: savedDocument.s3_key,
          status: savedDocument.status
        });

        // ✅ FIXED: Return the updated document with correct field names for frontend
        return NextResponse.json({
            id: savedDocument.id,
            fileName: savedDocument.file_name,           // RAG-generated filename preserved
            originalFileName: savedDocument.original_file_name,
            fileSize: savedDocument.file_size,
            status: savedDocument.status,
            updatedAt: savedDocument.updated_at,
            s3Key: savedDocument.s3_key,
            s3Url: savedDocument.file_path,
            message: `Document saved to cloud storage with intelligent filename: ${savedDocument.file_name}`
        });

    } catch (error) {
        console.error('Error saving document:', error);
        
        if (error instanceof Error) {
            if (error.message === 'No token provided') {
                return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
            }
            if (error.message === 'User not found') {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }
            if (error.message.includes('Document not found')) {
                return NextResponse.json({ error: error.message }, { status: 404 });
            }
            if (error.message.includes('Temporary file not found')) {
                return NextResponse.json({ 
                    error: 'Document file no longer available. Please re-upload the document.' 
                }, { status: 410 });
            }
            if (error.message.includes('cloud storage') || error.message.includes('S3')) {
                return NextResponse.json({ 
                    error: error.message 
                }, { status: 500 });
            }
        }
        
        return NextResponse.json({ 
            error: 'Failed to save document' 
        }, { status: 500 });
    }
}

// GET endpoint to check if document can be saved
export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromToken(request);
        const { searchParams } = new URL(request.url);
        const document_id = searchParams.get('document_id');
        
        if (!document_id) {
            return NextResponse.json({ 
                error: 'Document ID is required' 
            }, { status: 400 });
        }

        const document = await prisma.document.findFirst({
            where: { 
                id: document_id,
                owner_id: user.id
            },
            select: {
                id: true,
                file_name: true,
                original_file_name: true,
                status: true,
                updated_at: true,
                file_path: true
            }
        });

        if (!document) {
            return NextResponse.json({ 
                error: 'Document not found' 
            }, { status: 404 });
        }

        const canSave = document.status === 'TEMPORARY';
        const tempFileExists = document.file_path ? fs.existsSync(document.file_path) : false;

        return NextResponse.json({
            id: document.id,
            fileName: document.file_name,           // RAG-generated filename
            originalFileName: document.original_file_name,
            status: document.status,
            updatedAt: document.updated_at,
            canSave: canSave && tempFileExists,
            tempFileExists: tempFileExists,
            message: canSave 
                ? (tempFileExists ? `Document can be saved with intelligent filename: ${document.file_name}` : 'Temporary file expired, please re-upload')
                : 'Document is already saved or cannot be saved'
        });

    } catch (error) {
        console.error('Error checking document save status:', error);
        return NextResponse.json({ 
            error: 'Failed to check document status' 
        }, { status: 500 });
    }
}