// src/app/api/folders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

console.log('🗂️ Folders API route loaded');

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

// POST /api/folders - Create new folder
export async function POST(request: NextRequest) {
  console.log('📝 POST /api/folders called');
  
  try {
    const user = await getUserFromToken(request);
    const { name, parentId } = await request.json();

    console.log('📁 Creating folder:', { name, parentId, userId: user.id });

    // Validate input
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    // Validate folder name (no special characters, reasonable length)
    const sanitizedName = name.trim();
    if (sanitizedName.length === 0 || sanitizedName.length > 255) {
      return NextResponse.json({ error: 'Folder name must be between 1 and 255 characters' }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9\s\-_\.()]+$/.test(sanitizedName)) {
      return NextResponse.json({ error: 'Folder name contains invalid characters' }, { status: 400 });
    }

    // Check if parent folder exists (if specified)
    let parentFolder = null;
    if (parentId) {
      parentFolder = await prisma.folder.findFirst({
        where: { id: parentId, owner_id: user.id }
      });

      if (!parentFolder) {
        return NextResponse.json({ error: 'Parent folder not found' }, { status: 404 });
      }
    }

    // Check for duplicate folder names in the same directory
    const existingFolder = await prisma.folder.findFirst({
      where: {
        name: sanitizedName,
        parent_id: parentId || null,
        owner_id: user.id
      }
    });

    if (existingFolder) {
      return NextResponse.json({ error: 'A folder with this name already exists in this location' }, { status: 409 });
    }

    // Create the folder
    const folder = await prisma.folder.create({
      data: {
        name: sanitizedName,
        parent_id: parentId || null,
        owner_id: user.id,
        path: parentFolder ? `${parentFolder.path}/${sanitizedName}` : sanitizedName
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            documents: true,
            children: true
          }
        }
      }
    });

    console.log('✅ Folder created:', folder.id);

    return NextResponse.json({
      message: 'Folder created successfully',
      folder: {
        id: folder.id,
        name: folder.name,
        path: folder.path,
        parent_id: folder.parent_id,
        created_at: folder.created_at,
        updated_at: folder.updated_at,
        document_count: folder._count.documents,
        subfolder_count: folder._count.children
      }
    });

  } catch (error) {
    console.error('❌ Create folder error:', error);
    
    if (error instanceof Error && error.message.includes('JWT')) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
  }
}

// GET /api/folders - List user's folders with hierarchy
export async function GET(request: NextRequest) {
  console.log('📋 GET /api/folders called');
  
  try {
    const user = await getUserFromToken(request);
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    const includeChildren = searchParams.get('includeChildren') === 'true';

    console.log('📂 Loading folders for user:', user.id, 'parentId:', parentId);

    // Base query for folders
    const whereClause = {
      owner_id: user.id,
      parent_id: parentId || null
    };

    const folders = await prisma.folder.findMany({
      where: whereClause,
      include: {
        parent: true,
        children: includeChildren,
        _count: {
          select: {
            documents: true,
            children: true
          }
        }
      },
      orderBy: [
        { name: 'asc' }
      ]
    });

    console.log('📁 Found folders:', folders.length);

    // Also get documents in the current folder
    const documents = await prisma.document.findMany({
      where: {
        owner_id: user.id,
        folder_id: parentId || null
      },
      select: {
        id: true,
        file_name: true,
        original_file_name: true,
        file_size: true,
        status: true,
        page_count: true,
        uploaded_at: true,
        updated_at: true
      },
      orderBy: { updated_at: 'desc' }
    });

    console.log('📄 Found documents:', documents.length);

    // Build breadcrumbs if we're in a subfolder
    const breadcrumbs = [];
    if (parentId) {
      let currentId: string | null = parentId;
      while (currentId) {
        const folder: any = await prisma.folder.findUnique({
          where: { id: currentId }
        });
        if (folder && folder.owner_id === user.id) {
          breadcrumbs.unshift({ id: folder.id, name: folder.name });
          currentId = folder.parent_id;
        } else {
          break;
        }
      }
    }

    console.log('🍞 Breadcrumbs:', breadcrumbs.length);

    return NextResponse.json({
      folders: folders.map(folder => ({
        id: folder.id,
        name: folder.name,
        path: folder.path,
        parent_id: folder.parent_id,
        created_at: folder.created_at,
        updated_at: folder.updated_at,
        document_count: folder._count.documents,
        subfolder_count: folder._count.children,
        children: includeChildren ? folder.children : undefined
      })),
      documents: documents.map(doc => ({
        id: doc.id,
        fileName: doc.file_name,
        originalFileName: doc.original_file_name,
        size: doc.file_size,
        status: doc.status,
        pages: doc.page_count,
        uploadedAt: doc.uploaded_at,
        updatedAt: doc.updated_at
      })),
      breadcrumbs,
      currentFolder: parentId
    });

  } catch (error) {
    console.error('❌ List folders error:', error);
    
    if (error instanceof Error && error.message.includes('JWT')) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Failed to retrieve folders' }, { status: 500 });
  }
}