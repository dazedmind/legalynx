// /backend/api/documents/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /backend/api/documents/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        _count: {
          select: {
            chatSessions: true
          }
        },
        chatSessions: {
          orderBy: { updatedAt: 'desc' },
          take: 5, // Get recent sessions
          select: {
            id: true,
            title: true,
            updatedAt: true,
            isSaved: true
          }
        }
      }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

// PATCH /backend/api/documents/[id]
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;
    const body = await request.json();

    const { status, metadata, pages, size, ...updateData } = body;

    const updatePayload: any = { ...updateData };
    if (status !== undefined) updatePayload.status = status;
    if (metadata !== undefined) updatePayload.metadata = metadata;
    if (pages !== undefined) updatePayload.pages = pages;
    if (size !== undefined) updatePayload.size = size;

    const document = await prisma.document.update({
      where: { id: documentId },
      data: updatePayload
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

// DELETE /backend/api/documents/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;

    // Delete associated chat sessions and messages (cascade should handle this)
    await prisma.chatSession.deleteMany({
      where: { documentId }
    });

    // Delete the document
    await prisma.document.delete({
      where: { id: documentId }
    });

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}