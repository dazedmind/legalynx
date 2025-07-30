// ===== CREATE: src/app/backend/api/user-settings/usage/route.ts =====
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
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

// GET /backend/api/user-settings/usage - Get usage information
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    
    // Get current subscription
    const subscription = await prisma.subscription.findUnique({
      where: { user_id: user.id },
      select: {
        tokens_used: true,
        token_limit: true,
        plan_type: true,
        tokens_reset_date: true
      }
    });
    
    // Get storage usage
    const storageUsed = await StorageTracker.updateStorageUsage(user.id);
    
    // Calculate storage limit based on plan
    let storageLimit = 10 * 1024 * 1024 * 1024; // Default 10GB
    switch (subscription?.plan_type) {
      case 'BASIC':
        storageLimit = 500 * 1024 * 1024 * 1024; // 500GB
        break;
      case 'STANDARD':
        storageLimit = 1024 * 1024 * 1024 * 1024; // 1TB
        break;
      case 'PREMIUM':
        storageLimit = 10 * 1024 * 1024 * 1024 * 1024; // 10TB
        break;
    }
    
    // Get document count
    const documentCount = await prisma.document.count({
      where: {
        owner_id: user.id,
        status: { in: ['INDEXED', 'PROCESSED'] }
      }
    });
    
    // Get today's token usage
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayTokens = await prisma.tokenUsageLog.aggregate({
      where: {
        user_id: user.id,
        created_at: { gte: todayStart }
      },
      _sum: { tokens_used: true }
    });
    
    return NextResponse.json({
      tokens: {
        used: subscription?.tokens_used || 0,
        limit: subscription?.token_limit || 0,
        percentage: subscription?.token_limit ? 
          ((subscription.tokens_used / subscription.token_limit) * 100) : 0,
        today_usage: todayTokens._sum.tokens_used || 0,
        reset_date: subscription?.tokens_reset_date
      },
      storage: {
        used_bytes: storageUsed,
        used_gb: parseFloat((storageUsed / (1024 * 1024 * 1024)).toFixed(3)),
        limit_bytes: storageLimit,
        limit_gb: parseFloat((storageLimit / (1024 * 1024 * 1024)).toFixed(0)),
        percentage: parseFloat(((storageUsed / storageLimit) * 100).toFixed(1)),
        available_gb: parseFloat(((storageLimit - storageUsed) / (1024 * 1024 * 1024)).toFixed(3))
      },
      documents: {
        total_count: documentCount
      },
      plan: subscription?.plan_type || 'BASIC',
      last_calculated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Get usage info error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('No token provided') || error.message.includes('User not found')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to get usage information' }, 
      { status: 500 }
    );
  }
}