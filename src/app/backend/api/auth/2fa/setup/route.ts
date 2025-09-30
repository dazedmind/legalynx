// src/app/backend/api/auth/2fa/setup/route.ts - Alternative approach
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// Try different import methods for speakeasy
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Alternative: If above doesn't work, try this:
// import * as speakeasy from 'speakeasy';
// import * as QRCode from 'qrcode';

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

// POST /backend/api/auth/2fa/setup - Generate 2FA secret and QR code
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);

    // Debug: Check if speakeasy is properly loaded
    console.log('Speakeasy methods available:', Object.keys(speakeasy));

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

    // Generate a new secret - try different approaches
    let secret;
    try {
      secret = speakeasy.generateSecret({
        name: `LEGALYNX (${user.email})`,
        issuer: 'LEGALYNX',
        length: 32,
      });
    } catch (generateError) {
      console.error('First attempt failed:', generateError);
      
      // Fallback approach
      try {
        secret = speakeasy.generateSecret({
          name: `LEGALYNX:${user.email}`,
          length: 20, // Try shorter length
        });
      } catch (fallbackError) {
        console.error('Fallback attempt failed:', fallbackError);
        throw new Error('Unable to generate 2FA secret');
      }
    }

    console.log('Generated secret object:', {
      hasBase32: !!secret?.base32,
      hasOtpauthUrl: !!secret?.otpauth_url,
      secretKeys: secret ? Object.keys(secret) : 'no secret'
    });

    // Verify we have the required fields
    if (!secret || !secret.base32) {
      throw new Error('Failed to generate valid 2FA secret - missing base32');
    }

    // Create manual OTPAUTH URL if not generated automatically
    const otpauthUrl = secret.otpauth_url || 
      `otpauth://totp/LEGALYNX:${encodeURIComponent(user.email)}?secret=${secret.base32}&issuer=LEGALYNX`;

    // Store the temporary secret (not yet verified) in UserSettings
    await prisma.userSettings.upsert({
      where: { user_id: user.id },
      update: {
        two_factor_secret: secret.base32,
        last_settings_update: new Date(),
      },
      create: {
        user_id: user.id,
        two_factor_enabled: false,
        two_factor_secret: secret.base32,
        // Default values - only include properties that exist in the schema
        auto_rename_files: false,
        file_naming_format: 'ORIGINAL',
        theme: 'light',
        date_format: 'MM/DD/YYYY',
        last_settings_update: new Date(),
      }
    });

    // Generate QR code
    console.log('Generating QR code for URL:', otpauthUrl);
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    return NextResponse.json({
      secret: secret.base32,
      qrCodeUrl: qrCodeUrl,
      manualEntryKey: secret.base32,
      backupCodes: [],
    });

  } catch (error) {
    console.error('2FA setup error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('No token provided') || error.message.includes('User not found')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
    }
    
    return NextResponse.json(
      { error: `Failed to setup 2FA: ${error instanceof Error ? error.message : 'Unknown error'}` }, 
      { status: 500 }
    );
  }
}