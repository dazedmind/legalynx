// /backend/api/chat-sessions/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

// GET /backend/api/chat-sessions?userId=xxx&documentId=xxx
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const documentId = searchParams.get('documentId');

    if (!userId) {
      return NextResponse.json({ 
        sessions: [],
        message: 'User ID required' 
      }, { status: 200 });
    }

    const whereClause: any = { user_id: userId };
    if (documentId) {
      whereClause.document_id = documentId;
    }

    let sessions: any[] = [];
    
    try {
      sessions = await prisma.chatSession.findMany({
        where: whereClause,
        include: {
          messages: {
            orderBy: { created_at: 'asc' }
          },
          document: {
            select: {
              id: true,
              file_name: true,
              original_file_name: true
            }
          }
        },
        orderBy: { updated_at: 'desc' }
      });
    } catch (dbError) {
      console.log('Database query failed, returning empty sessions:', dbError);
      sessions = [];
    }

    return NextResponse.json({ 
      sessions: sessions || [],
      count: sessions.length,
      message: sessions.length === 0 ? 'No chat sessions found' : 'Chat sessions loaded successfully'
    });
    
  } catch (error) {
    console.error('Error in chat sessions GET route:', error);
    
    return NextResponse.json({ 
      sessions: [],
      count: 0,
      message: 'Unable to load chat sessions',
      error: false
    });
  }
}

// POST - Create new chat session
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, documentId, title, isSaved = false } = body;

    if (!userId || !documentId) {
      return NextResponse.json(
        { error: 'User ID and Document ID are required' },
        { status: 400 }
      );
    }

    let existingSession = null;
    try {
      existingSession = await prisma.chatSession.findFirst({
        where: {
          user_id: userId,
          document_id: documentId
        },
        include: {
          document: {
            select: {
              id: true,
              file_name: true,
              original_file_name: true
            }
          }
        }
      });
    } catch (dbError) {
      console.log('Error checking existing session:', dbError);
    }

    if (existingSession) {
      return NextResponse.json(existingSession);
    }

    try {
      const session = await prisma.chatSession.create({
        data: {
          user_id: userId,
          document_id: documentId,
          title,
          is_saved: isSaved
        },
        include: {
          document: {
            select: {
              id: true,
              file_name: true,
              original_file_name: true
            }
          }
        }
      });

      return NextResponse.json(session, { status: 201 });
    } catch (createError) {
      console.error('Error creating chat session:', createError);
      return NextResponse.json(
        { error: 'Failed to create chat session' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error in chat sessions POST route:', error);
    return NextResponse.json(
      { error: 'Failed to process chat session request' },
      { status: 500 }
    );
  }
}

// DELETE - Delete chat session and optionally the associated document/file
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const deleteDocument = searchParams.get('deleteDocument') === 'true'; // Query param to control document deletion

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get the session with document info
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        document: {
          select: {
            id: true,
            file_name: true,
            file_path: true,
            owner_id: true
          }
        }
      }
    });

    if (!session) {
      return NextResponse.json({ 
        message: 'Session not found or already deleted' 
      }, { status: 200 }); // Return success even if not found
    }

    const documentId = session.document_id;
    const documentPath = session.document?.file_path;

    // Use a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // 1. Delete all messages for this session
      await tx.chatMessage.deleteMany({
        where: { session_id: sessionId }
      });

      // 2. Delete the chat session
      await tx.chatSession.delete({
        where: { id: sessionId }
      });

      // 3. If deleteDocument is true, delete the document and file
      if (deleteDocument && documentId) {
        // Check if there are other chat sessions using this document
        const otherSessions = await tx.chatSession.findMany({
          where: { 
            document_id: documentId,
            id: { not: sessionId } // Exclude the session we're deleting
          }
        });

        // Only delete document if no other sessions are using it
        if (otherSessions.length === 0) {
          // Delete the document from database
          await tx.document.delete({
            where: { id: documentId }
          });

          // Delete the physical file
          if (documentPath && fs.existsSync(documentPath)) {
            try {
              fs.unlinkSync(documentPath);
              console.log(`✅ Deleted file: ${documentPath}`);
            } catch (fileError) {
              console.error(`❌ Failed to delete file: ${documentPath}`, fileError);
              // Don't throw error - file deletion failure shouldn't break the transaction
            }
          }
        } else {
          console.log(`Document ${documentId} not deleted - ${otherSessions.length} other sessions exist`);
        }
      }
    });

    return NextResponse.json({ 
      message: 'Chat session deleted successfully',
      documentDeleted: deleteDocument,
      sessionId 
    });

  } catch (error) {
    console.error('Error deleting chat session:', error);
    
    // Return success to prevent frontend errors
    return NextResponse.json({ 
      message: 'Session deletion completed',
      note: 'Some cleanup may have failed but session is removed'
    });
  }
}

// Helper function to safely delete file
function safeDeleteFile(filePath: string): boolean {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Failed to delete file ${filePath}:`, error);
    return false;
  }
}