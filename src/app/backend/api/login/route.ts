"use server"
import { prisma } from "@/lib/prisma";
import bcrypt from 'bcryptjs';
import { NextResponse } from "next/server";
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();
        
        // Validate input
        if (!email || !password) {
            return NextResponse.json({ 
                message: "Email and password are required" 
            }, { status: 400 });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                password: true,
                email_verified: true,
                status: true,
            }
        });

        if (!user) {
            return NextResponse.json({ 
                message: "User not found" 
            }, { status: 404 });
        }

        // Check if email is verified
        if (!user.email_verified) {
            return NextResponse.json({ 
                message: "Please verify your email before logging in" 
            }, { status: 401 });
        }

        // Check if user account is active
        if (user.status !== 'ACTIVE') {
            return NextResponse.json({ 
                message: "Your account has been suspended. Please contact support." 
            }, { status: 401 });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return NextResponse.json({ 
                message: "Invalid email or password" 
            }, { status: 401 });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined');
        }

        const token = jwt.sign(
            { 
                userId: user.id,
                email: user.email 
            }, 
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { last_login_at: new Date() }
        });

          // Log security event
          await prisma.securityLog.create({
            data: {
                user_id: user.id,
                action: 'LOGIN',
                details: 'User logged in successfully',
                ip_address: request.headers.get('x-forwarded-for') || 
                          request.headers.get('x-real-ip') || 
                          'unknown',
                user_agent: request.headers.get('user-agent') || 'unknown'
            }
        });

        // Return success response (exclude password)
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json({
            message: "Login successful",
            user: userWithoutPassword,
            token: token
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: "Invalid request" }, { status: 400 });
    }    
}