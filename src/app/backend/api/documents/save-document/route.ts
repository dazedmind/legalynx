// src/app/backend/api/documents/save-document/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

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

async function saveDocument(documentId: string, title: string) {
    const document = await prisma.document.findUnique({
        where: { id: documentId }
    });

    if (!document) {
        throw new Error('Document not found');
    }

    if (document) {
        await prisma.document.update({
            where: { id: documentId },
            data: {
                status: 'INDEXED',
            }
        });
    }

    return document;
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromToken(request);
        const { documentId, title } = await request.json();

        const document = await saveDocument(documentId, title);

        return NextResponse.json(document);
    } catch (error) {
        console.error('Error saving document:', error);
        return NextResponse.json({ error: 'Failed to save document' }, { status: 500 });
    }
}