import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Find and validate token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token }
    });

    if (!verificationToken) {
      return NextResponse.json({ error: 'Invalid verification link' }, { status: 400 });
    }

    if (verificationToken.used) {
      return NextResponse.json({ error: 'This verification link has already been used' }, { status: 400 });
    }

    if (verificationToken.expires_at < new Date()) {
      return NextResponse.json({ error: 'Verification link has expired' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: verificationToken.email }
    });

    if (existingUser && existingUser.email_verified) {
      return NextResponse.json({ error: 'Email is already verified' }, { status: 400 });
    }

    // For new users, we need to get the registration data
    // In a production app, you'd store this temporarily in the database
    // For now, we'll create a basic user account
    if (!existingUser) {
      // Create new user - password will be set during login/account setup
      await prisma.user.create({
        data: {
          email: verificationToken.email,
          password: verificationToken.key,
          name: '',
          email_verified: true,
          status: 'ACTIVE',
          subscription: {
            create: {
              plan_type: 'BASIC',
              created_at: new Date(),
              billing_date: new Date(),
              days_remaining: 30,
              token_limit: 1000,
              is_active: true,
              auto_renew: true
            }
          },
          profile_picture: '',
          job_title: '',
          user_settings: {
            create: {
              theme: 'light',
            }
          },
          created_at: new Date(),
          last_login_at: new Date()
        }
      });
    } else {
      // Verify existing user
      await prisma.user.update({
        where: { email: verificationToken.email },
        data: { 
            email_verified: true,
            password: verificationToken.key
        }
      });
    }

    // Mark token as used
    await prisma.verificationToken.update({
      where: { token },
      data: { used: true }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Email verified successfully',
      email: verificationToken.email
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}