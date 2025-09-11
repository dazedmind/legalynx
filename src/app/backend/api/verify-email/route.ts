import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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

    let user;
    
    // For new users, we need to get the registration data
    // In a production app, you'd store this temporarily in the database
    // For now, we'll create a basic user account
    if (!existingUser) {
      // Create new user - password will be set during login/account setup
      user = await prisma.user.create({
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
        },
        include: {
          subscription: true
        }
      });
    } else {
      // Verify existing user
      user = await prisma.user.update({
        where: { email: verificationToken.email },
        data: { 
            email_verified: true,
            password: verificationToken.key
        },
        include: {
          subscription: true
        }
      });
    }

    // Mark token as used
    await prisma.verificationToken.update({
      where: { token },
      data: { used: true }
    });

    // Create JWT token for automatic login
    const jwtToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Format user data for frontend
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      email_verified: user.email_verified,
      status: user.status,
      subscription: {
        plan_type: user.subscription?.plan_type || 'BASIC',
        created_at: user.subscription?.created_at?.toISOString() || new Date().toISOString(),
        billing_date: user.subscription?.billing_date?.toISOString() || new Date().toISOString(),
        days_remaining: user.subscription?.days_remaining || 30,
        tokens_used: user.subscription?.tokens_used || 0,
        token_limit: user.subscription?.token_limit || 1000,
        is_active: user.subscription?.is_active || true,
        auto_renew: user.subscription?.auto_renew || true
      },
      profile_picture: user.profile_picture,
      job_title: user.job_title
    };

    return NextResponse.json({ 
      success: true,
      message: 'Email verified successfully',
      email: verificationToken.email,
      token: jwtToken,
      user: userData
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}