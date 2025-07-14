// src/app/backend/api/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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

// GET /backend/api/profile - Get user profile
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);

    // Get user statistics
    const [documentCount, chatSessionCount, totalMessages] = await Promise.all([
      prisma.document.count({
        where: { owner_id: user.id }
      }),
      prisma.chatSession.count({
        where: { user_id: user.id }
      }),
      prisma.chatMessage.count({
        where: {
          session: {
            user_id: user.id
          }
        }
      })
    ]);

    // Get recent activity (last 5 documents)
    const recentDocuments = await prisma.document.findMany({
      where: { owner_id: user.id },
      orderBy: { uploaded_at: 'desc' },
      take: 5,
      select: {
        id: true,
        original_file_name: true,
        uploaded_at: true,
        file_size: true,
        page_count: true
      }
    });

    // Get recent chat sessions
    const recentSessions = await prisma.chatSession.findMany({
      where: { user_id: user.id },
      orderBy: { updated_at: 'desc' },
      take: 5,
      include: {
        document: {
          select: {
            original_file_name: true
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      }
    });

    // Return profile data (exclude sensitive information)
    const profile = {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.email_verified,
      status: user.status,
      isPaidUser: user.is_paid_user,
      profilePicture: user.profile_picture,
      jobTitle: user.job_title,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
      
      // Statistics
      stats: {
        documentCount,
        chatSessionCount,
        totalMessages,
        storageUsed: recentDocuments.reduce((total, doc) => total + (doc.file_size || 0), 0)
      },
      
      // Recent activity
      recentActivity: {
        documents: recentDocuments.map(doc => ({
          id: doc.id,
          name: doc.original_file_name,
          uploadedAt: doc.uploaded_at,
          size: doc.file_size,
          pages: doc.page_count
        })),
        chatSessions: recentSessions.map(session => ({
          id: session.id,
          title: session.title,
          documentName: session.document.original_file_name,
          messageCount: session._count.messages,
          lastActivity: session.updated_at,
          isSaved: session.is_saved
        }))
      }
    };

    return NextResponse.json(profile);

  } catch (error) {
    console.error('Get profile error:', error);
    
    if (error instanceof Error && error.message === 'No token provided') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    if (error instanceof Error && error.message === 'User not found') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 });
  }
}

// PATCH /backend/api/profile - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    const body = await request.json();
    
    const { name, jobTitle, profilePicture, currentPassword, newPassword } = body;

    // Prepare update data
    const updateData: any = {};
    
    // Basic profile updates
    if (name !== undefined) updateData.name = name;
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

    // Password change (if requested)
    if (newPassword && currentPassword) {
      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
      
      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      updateData.password = hashedNewPassword;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        email_verified: true,
        status: true,
        is_paid_user: true,
        profile_picture: true,
        job_title: true,
        created_at: true,
        last_login_at: true
      }
    });

    // Log security event for profile updates
    await prisma.securityLog.create({
      data: {
        user_id: user.id,
        action: 'PROFILE_UPDATE',
        details: `Updated profile fields: ${Object.keys(updateData).join(', ')}`,
        ip_address: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error instanceof Error && error.message === 'No token provided') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

// DELETE /backend/api/profile - Delete user account
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    const { searchParams } = new URL(request.url);
    const confirmDelete = searchParams.get('confirm');

    if (confirmDelete !== 'true') {
      return NextResponse.json({ 
        error: 'Account deletion requires confirmation' 
      }, { status: 400 });
    }

    // Use transaction to ensure all data is deleted together
    await prisma.$transaction(async (tx) => {
      // Delete user's chat messages
      await tx.chatMessage.deleteMany({
        where: {
          session: {
            user_id: user.id
          }
        }
      });

      // Delete user's chat sessions
      await tx.chatSession.deleteMany({
        where: { user_id: user.id }
      });

      // Delete user's documents
      await tx.document.deleteMany({
        where: { owner_id: user.id }
      });

      // Delete security logs
      await tx.securityLog.deleteMany({
        where: { user_id: user.id }
      });

      // Delete verification tokens
      await tx.verificationToken.deleteMany({
        where: { email: user.email }
      });

      // Finally, delete the user
      await tx.user.delete({
        where: { id: user.id }
      });
    });

    return NextResponse.json({
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    
    if (error instanceof Error && error.message === 'No token provided') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}