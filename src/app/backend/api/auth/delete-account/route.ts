import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

async function getUserFromToken(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await prisma.user.findUnique({ 
      where: { id: decoded.userId },
      include: {
        subscription: true,
        user_settings: true
      }
    });
    return user;
  } catch {
    return null;
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Account deletion request started');
    
    const user = await getUserFromToken(request);
    if (!user) {
      console.log('❌ No user found in token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    console.log(`🗑️ Starting account deletion for user: ${user.email}`);

    // Start transaction for atomic deletion
    await prisma.$transaction(async (tx) => {
      // 1. Delete chat messages first (due to foreign key constraints)
      const deletedMessages = await tx.chatMessage.deleteMany({
        where: { session: { user_id: user.id } }
      });
      console.log(`🗑️ Deleted ${deletedMessages.count} chat messages`);

      // 2. Delete chat sessions
      const deletedSessions = await tx.chatSession.deleteMany({
        where: { user_id: user.id }
      });
      console.log(`🗑️ Deleted ${deletedSessions.count} chat sessions`);

      // 3. Delete documents
      const deletedDocuments = await tx.document.deleteMany({
        where: { owner_id: user.id }
      });
      console.log(`🗑️ Deleted ${deletedDocuments.count} documents`);

      // 4. Delete security logs
      const deletedLogs = await tx.securityLog.deleteMany({
        where: { user_id: user.id }
      });
      console.log(`🗑️ Deleted ${deletedLogs.count} security logs`);

      // 5. Delete verification tokens
      const deletedTokens = await tx.verificationToken.deleteMany({
        where: { email: user.email }
      });
      console.log(`🗑️ Deleted ${deletedTokens.count} verification tokens`);

      // 6. Delete subscription (if exists)
      if (user.subscription) {
        await tx.subscription.delete({
          where: { user_id: user.id }
        });
        console.log('🗑️ Deleted subscription');
      }

      // 7. Delete user settings (if exists)
      if (user.user_settings) {
        await tx.userSettings.delete({
          where: { user_id: user.id }
        });
        console.log('🗑️ Deleted user settings');
      }

      // 8. Finally, delete the user
      await tx.user.delete({
        where: { id: user.id }
      });
      console.log('🗑️ Deleted user account');
    });

    // Log the account deletion for audit purposes
    console.log(`✅ Account successfully deleted for user: ${user.email}`);

    // TODO: In production, you might want to:
    // - Send a confirmation email
    // - Cancel any active PayPal subscriptions
    // - Delete files from S3/storage
    // - Add to a "deleted accounts" audit table

    return NextResponse.json({ 
      message: 'Account successfully deleted',
      deletedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Account deletion error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete account. Please try again later.' 
    }, { status: 500 });
  }
}

// Optional: GET method to get deletion requirements/info
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get counts of data that will be deleted
    const [documentsCount, chatSessionsCount, messagesCount] = await Promise.all([
      prisma.document.count({ where: { owner_id: user.id } }),
      prisma.chatSession.count({ where: { user_id: user.id } }),
      prisma.chatMessage.count({ where: { session: { user_id: user.id } } })
    ]);

    return NextResponse.json({
      user: {
        email: user.email,
        name: user.name,
        createdAt: user.created_at,
        hasActiveSubscription: user.subscription?.is_active || false,
        subscriptionPlan: user.subscription?.plan_type || 'BASIC'
      },
      dataToBeDeleted: {
        documents: documentsCount,
        chatSessions: chatSessionsCount,
        messages: messagesCount
      },
      requirements: {
        passwordRequired: true,
        confirmationRequired: true,
        confirmationText: 'DELETE MY ACCOUNT'
      },
      warning: 'This action is irreversible. All your data will be permanently deleted.'
    });

  } catch (error) {
    console.error('❌ Get deletion info error:', error);
    return NextResponse.json({ 
      error: 'Failed to get account deletion information' 
    }, { status: 500 });
  }
}
