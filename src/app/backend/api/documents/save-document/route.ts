// src/app/backend/api/documents/save-document/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

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

async function saveDocument(document_id: string, title: string, user_id: string) {
    // First, verify the document exists and belongs to the user
    const document = await prisma.document.findFirst({
        where: { 
            id: document_id,
            owner_id: user_id  // Updated to snake_case field name
        }
    });

    if (!document) {
        throw new Error('Document not found or you do not have permission to access it');
    }

    // Update the document
    const updatedDocument = await prisma.document.update({
        where: { id: document.id },
        data: {
            status: 'INDEXED',
            updated_at: new Date() // Explicitly update the timestamp
        }
    });

    return updatedDocument;
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromToken(request);
        const body = await request.json();
        
        // Validate required fields
        const { document_id, title } = body;
        
        if (!document_id) {
            return NextResponse.json({ 
                error: 'Document ID is required' 
            }, { status: 400 });
        }

        console.log(`Saving document ${document_id} for user ${user.id}`);

        const document = await saveDocument(document_id, title, user.id);

        // Log security event
        await prisma.securityLog.create({
            data: {
                user_id: user.id,
                action: 'DOCUMENT_UPLOAD',
                details: `Saved document: ${document.original_file_name}`,
                ip_address: request.headers.get('x-forwarded-for') || 
                          request.headers.get('x-real-ip') || 
                          'unknown',
                user_agent: request.headers.get('user-agent') || 'unknown'
            }
        });

        // Return the updated document with snake_case fields
        return NextResponse.json({
            id: document.id,
            fileName: document.file_name,
            originalName: document.original_file_name,
            status: document.status,
            updatedAt: document.updated_at,
            message: 'Document saved successfully'
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
        }
        
        return NextResponse.json({ 
            error: 'Failed to save document' 
        }, { status: 500 });
    }
}

// Optional: Add a GET endpoint to check document status
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
            }
        });

        if (!document) {
            return NextResponse.json({ 
                error: 'Document not found' 
            }, { status: 404 });
        }

        return NextResponse.json({
            id: document.id,
            fileName: document.file_name,
            originalName: document.original_file_name,
            status: document.status,
            updatedAt: document.updated_at,
        });

    } catch (error) {
        console.error('Error getting document:', error);
        return NextResponse.json({ 
            error: 'Failed to get document' 
        }, { status: 500 });
    }
}   