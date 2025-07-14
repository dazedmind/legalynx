"use server"
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from 'jsonwebtoken';

// Helper function to get user from token
async function getUserFromToken(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid authorization header provided');
  }

  const token = authHeader.replace('Bearer ', '');
  
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

export async function POST(request: Request) {
    try {
        // Get user from JWT token
        const user = await getUserFromToken(request);

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // Find all TEMPORARY documents for this user
        const temporaryDocuments = await prisma.document.findMany({
            where: {
                ownerId: user.id, // Assuming the field is ownerId based on your schema
                status: 'TEMPORARY'
            },
            select: {
                id: true,
                originalFileName: true,
                status: true
            }
        });

        console.log(`Found ${temporaryDocuments.length} TEMPORARY documents for user ${user.id}`);

        // Delete all TEMPORARY documents and their related data
        if (temporaryDocuments.length > 0) {
            // Use transaction to ensure data consistency
            await prisma.$transaction(async (tx) => {
                // First, delete all chat messages for sessions related to these documents
                await tx.chatMessage.deleteMany({
                    where: {
                        session: {
                            documentId: {
                                in: temporaryDocuments.map(doc => doc.id)
                            }
                        }
                    }
                });

                // Then delete all chat sessions for these documents
                await tx.chatSession.deleteMany({
                    where: {
                        documentId: {
                            in: temporaryDocuments.map(doc => doc.id)
                        }
                    }
                });

                // Finally, delete the TEMPORARY documents
                await tx.document.deleteMany({
                    where: {
                        ownerId: user.id,
                        status: 'TEMPORARY'
                    }
                });
            });

            console.log(`Deleted ${temporaryDocuments.length} TEMPORARY documents and related data for user ${user.id}`);
        }
       

        return NextResponse.json({ 
            message: "User logged out successfully",
            deletedDocuments: temporaryDocuments.length
        }, { status: 200 });
        
    } catch (error) {
        console.error('Logout error:', error);
        
        // Handle specific JWT errors
        if (error instanceof Error && error.name === 'JsonWebTokenError') {
            return NextResponse.json({ message: "Invalid token" }, { status: 401 });
        }
        if (error instanceof Error && error .name === 'TokenExpiredError') {
            return NextResponse.json({ message: "Token expired" }, { status: 401 });
        }
        
        return NextResponse.json({ 
            message: "Internal server error",
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}