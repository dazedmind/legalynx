import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);
const EMAIL_FROM = process.env.EMAIL_FROM as string;

export async function POST(req: Request) {
    try {
      const { email, password, confirmPassword } = await req.json();
      
      // Basic validation
      if (!email || !password || password !== confirmPassword) {
        return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser && existingUser.emailVerified) {
        return NextResponse.json({ error: 'User already exists' }, { status: 400 });
      }

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store verification token
      await prisma.verificationToken.create({
        data: {
          email,
          token: verificationToken,
          expiresAt,
          type: 'EMAIL_VERIFICATION',
          key: hashedPassword
        }
      });

      // Create verification URL
      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/frontend/register/verify?token=${verificationToken}`;

      const msg = {
        to: email,
        from: EMAIL_FROM,
        subject: 'LegalynX Email Verification',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
            <h1 style="color: #0047AB; margin-bottom: 30px;">LegalynX</h1>
            <p style="font-size: 16px; margin-bottom: 15px; color: #000;">Thank you for registering with LegalynX. Please click the button below to verify your email.</p>
            <a href="${verificationUrl}" style="display:inline-block; padding: 10px 20px; background-color:#0047AB; color: white; text-decoration: none; border-radius: 8px; margin-top: 20px;">Verify Email</a>
            <p style="font-size: 14px; color: #666; margin-top: 20px;">This link will expire in 24 hours.</p>
            <p style="font-size: 14px; color: #666; margin-top: 10px;">If you did not request this, please ignore this email.</p>
          </div>
        `,
      };
  
      await sgMail.send(msg);
      
      console.log(`Verification email sent to ${email}`);
      
      return NextResponse.json({ 
        success: true,
        message: 'Verification email sent successfully'
      }); 
    } catch (error) {
      console.error('Email send error:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
}