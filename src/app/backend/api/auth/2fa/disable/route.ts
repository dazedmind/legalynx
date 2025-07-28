// src/app/backend/api/auth/2fa/disable/route.ts
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

// POST /backend/api/auth/2fa/disable - Disable 2FA for user
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);

    // Get user settings to check 2FA status
    const userSettings = await prisma.userSettings.findUnique({
      where: { user_id: user.id }
    });

    // Check if 2FA is enabled
    if (!userSettings?.two_factor_enabled) {
      return NextResponse.json(
        { error: '2FA is not enabled for this account' }, 
        { status: 400 }
      );
    }

    // Disable 2FA in UserSettings
    await prisma.userSettings.update({
      where: { user_id: user.id },
      data: {
        two_factor_enabled: false,
        two_factor_secret: null, // Remove the secret
        last_settings_update: new Date(),
      }
    });

    // Log 2FA disablement
    await prisma.securityLog.create({
      data: {
        user_id: user.id,
        action: 'TWO_FACTOR_DISABLED',
        details: 'User disabled 2FA',
        ip_address: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      message: '2FA disabled successfully',
      enabled: false
    });

  } catch (error) {
    console.error('2FA disable error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('No token provided') || error.message.includes('User not found')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to disable 2FA' }, 
      { status: 500 }
    );
  }
}