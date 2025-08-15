// src/app/backend/api/auth/2fa/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import * as speakeasy from 'speakeasy';

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

// POST /backend/api/auth/2fa/verify - Verify 2FA token and enable 2FA
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    const { token, secret } = await request.json();

    if (!token || !secret) {
      return NextResponse.json(
        { error: 'Token and secret are required' }, 
        { status: 400 }
      );
    }

    // Validate token format (6 digits)
    if (!/^\d{6}$/.test(token)) {
      return NextResponse.json(
        { error: 'Invalid token format. Must be 6 digits.' }, 
        { status: 400 }
      );
    }

    // Get user settings to check 2FA status
    const userSettings = await prisma.userSettings.findUnique({
      where: { user_id: user.id }
    });

    // Check if 2FA is already enabled
    if (userSettings?.two_factor_enabled) {
      return NextResponse.json(
        { error: '2FA is already enabled for this account' }, 
        { status: 400 }
      );
    }

    // Verify the token against the secret
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2, // Allow 2 time steps tolerance (60 seconds)
    });

    if (!verified) {
 
      return NextResponse.json(
        { error: 'Invalid verification code' }, 
        { status: 400 }
      );
    }

    // Enable 2FA in UserSettings
    await prisma.userSettings.upsert({
      where: { user_id: user.id },
      update: {
        two_factor_enabled: true,
        two_factor_secret: secret, // Save the verified secret
        last_settings_update: new Date(),
      },
      create: {
        user_id: user.id,
        two_factor_enabled: true,
        two_factor_secret: secret,
        // Set other default values - only include properties that exist in the schema
        auto_rename_files: false,
        file_naming_format: 'ORIGINAL',
        login_notifications: true,
        security_alerts: true,
        theme: 'light',
        date_format: 'MM/DD/YYYY',
        email_notifications: true,
        push_notifications: false,
        last_settings_update: new Date(),
      }
    });

    // Log successful 2FA enablement
    await prisma.securityLog.create({
      data: {
        user_id: user.id,
        action: 'TWO_FACTOR_ENABLED',
        details: 'User successfully enabled 2FA',
        ip_address: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      message: '2FA enabled successfully',
      enabled: true
    });

  } catch (error) {
    console.error('2FA verification error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('No token provided') || error.message.includes('User not found')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to verify 2FA token' }, 
      { status: 500 }
    );
  }
}