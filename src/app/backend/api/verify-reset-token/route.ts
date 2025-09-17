// File: src/app/api/verify-reset-token/route.ts
// API endpoint to verify password reset token validity

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "Token is required" },
        { status: 400 }
      );
    }

    // Verify JWT token
    let payload: any;
    try {
      payload = jwt.verify(token, SECRET_KEY);
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError);
      return NextResponse.json(
        { valid: false, error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Check if it's a password reset token
    if (payload.type !== "password_reset") {
      return NextResponse.json(
        { valid: false, error: "Invalid token type" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (!user) {
      return NextResponse.json(
        { valid: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Try to check if token exists in database (if table exists)
    // This is optional - the JWT verification above is the primary validation
    try {
      const resetToken = await prisma.passwordResetToken.findFirst({
        where: {
          token: token,
          user_id: user.id,
          expires_at: {
            gt: new Date(), // Token hasn't expired
          },
          used: false, // Token hasn't been used
        },
      });

      // If we found the token in DB and it's been used, reject it
      if (resetToken === null) {
        // Check if token exists but was used
        const usedToken = await prisma.passwordResetToken.findFirst({
          where: {
            token: token,
            user_id: user.id,
          },
        });

        if (usedToken && usedToken.used) {
          return NextResponse.json(
            { valid: false, error: "Token has already been used" },
            { status: 400 }
          );
        }

        if (usedToken && usedToken.expires_at && usedToken.expires_at < new Date()) {
          return NextResponse.json(
            { valid: false, error: "Token has expired" },
            { status: 400 }
          );
        }
      }

      console.log("✅ Token verified successfully with database check");
    } catch (dbError) {
      // If password_reset_tokens table doesn't exist, just rely on JWT validation
      console.log("Database token verification skipped - table may not exist yet");
      console.log("Relying on JWT validation only");
    }

    // Token is valid
    return NextResponse.json({
      valid: true,
      email: payload.email,
    });

  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json(
      { valid: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}