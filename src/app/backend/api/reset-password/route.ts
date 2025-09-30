// File: src/app/api/reset-password/route.ts
// API endpoint to handle password reset with token

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { SecurityAction } from "@prisma/client";

const SECRET_KEY = process.env.JWT_SECRET!;

// Helper function to get client IP
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIP = req.headers.get("x-real-ip");
  const remoteAddress = req.headers.get("x-forwarded-for") || 
                       req.headers.get("x-real-ip") || 
                       "unknown";
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || remoteAddress;
}

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();

    // Validate input
    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 }
      );
    }

    // Validate new password requirements
    if (newPassword.length < 9) {
      return NextResponse.json(
        { error: "Password must be at least 9 characters long" },
        { status: 400 }
      );
    }

    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSymbol) {
      return NextResponse.json(
        {
          error: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one symbol",
        },
        { status: 400 }
      );
    }

    // Verify JWT token
    let payload: any;
    try {
      payload = jwt.verify(token, SECRET_KEY);
    } catch (jwtError) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Check if it's a password reset token
    if (payload.type !== "password_reset") {
      return NextResponse.json(
        { error: "Invalid token type" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if token exists in database and is valid (optional if table exists)
    let resetToken = null;
    try {
      resetToken = await prisma.passwordResetToken.findFirst({
        where: {
          token: token,
          user_id: user.id,
          expires_at: {
            gt: new Date(), // Token hasn't expired
          },
          used: false, // Token hasn't been used
        },
      });

      // If we have database tracking and token was used/expired, reject it
      if (resetToken === null) {
        const anyToken = await prisma.passwordResetToken.findFirst({
          where: {
            token: token,
            user_id: user.id,
          },
        });

        if (anyToken) {
          // Log failed reset attempt
          try {
            await prisma.securityLog.create({
              data: {
                user_id: user.id,
                details: `Failed password reset attempt - token already used or expired from IP: ${getClientIP(req)}`,
                action: SecurityAction.PASSWORD_CHANGE,
                user_agent: req.headers.get("user-agent") || "",
                created_at: new Date(),
              },
            });
          } catch (logError) {
            console.error("Failed to log failed password reset attempt:", logError);
          }

          return NextResponse.json(
            { error: "Token has already been used or expired" },
            { status: 400 }
          );
        }
      }
    } catch (dbError) {
      console.log("Database token verification skipped - table may not exist yet");
      console.log("Proceeding with JWT-only validation");
    }

    // Check if new password is same as current password
    if (user.password) {
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        return NextResponse.json(
          { error: "New password must be different from current password" },
          { status: 400 }
        );
      }
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Start a transaction to update password and mark token as used (if token table exists)
    if (resetToken) {
      // We have database token tracking
      await prisma.$transaction(async (tx) => {
        // Update user password
        await tx.user.update({
          where: { id: user.id },
          data: {
            password: hashedPassword,
          },
        });

        // Mark token as used
        await tx.passwordResetToken.update({
          where: { id: resetToken.id },
          data: {
            used: true,
          },
        });

        // Invalidate all other reset tokens for this user
        await tx.passwordResetToken.updateMany({
          where: {
            user_id: user.id,
            id: { not: resetToken.id },
            used: false,
          },
          data: {
            used: true, // Mark as used to invalidate
          },
        });
      });
    } else {
      // No database token tracking, just update password
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
        },
      });
    }

    // Log successful password reset (temporarily disabled)
    try {
      console.log(`✅ Password reset completed for user: ${user.name} (${user.email}) - logging temporarily disabled`);

    } catch (logError) {
      // Don't fail the request if activity logging fails
      console.warn("Failed to log password reset activity:", logError);
    }

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully",
    });

  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
}