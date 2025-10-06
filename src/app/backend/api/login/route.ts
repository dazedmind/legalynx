// src/app/backend/api/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    const { email, password, twoFactorCode } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        {
          message: "Email and password are required",
        },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        subscription: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          message: "Invalid credentials. Please try again.",
        },
        { status: 401 }
      );
    }

    // Check if account is locked
    if (user.account_locked_until && user.account_locked_until > new Date()) {
      const remainingTime = Math.ceil((user.account_locked_until.getTime() - new Date().getTime()) / (1000 * 60 * 60));

      // Log failed login attempt on locked account
      await prisma.securityLog.create({
        data: {
          user_id: user.id,
          action: "FAILED_LOGIN",
          details: `Login attempt on locked account. Account locked for ${remainingTime} more hours.`,
          ip_address:
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "unknown",
          user_agent: request.headers.get("user-agent") || "unknown",
        },
      });

      return NextResponse.json(
        {
          message: `Account is locked due to multiple failed login attempts. Please try again in ${remainingTime} hours.`,
        },
        { status: 403 }
      );
    }

    // Check if account is active
    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        {
          message: "Account is inactive. Please contact support.",
        },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Increment failed login attempts
      const newFailedAttempts = user.failed_login_attempts + 1;
      const shouldLockAccount = newFailedAttempts >= 5;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failed_login_attempts: newFailedAttempts,
          account_locked_until: shouldLockAccount
            ? new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
            : null,
        },
      });

      // Log failed login attempt
      await prisma.securityLog.create({
        data: {
          user_id: user.id,
          action: shouldLockAccount ? "ACCOUNT_LOCKED" : "FAILED_LOGIN",
          details: shouldLockAccount
            ? "Account locked due to 5 failed login attempts"
            : `Failed login attempt (${newFailedAttempts}/5)`,
          ip_address:
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "unknown",
          user_agent: request.headers.get("user-agent") || "unknown",
        },
      });

      if (shouldLockAccount) {
        return NextResponse.json(
          {
            message: "Account locked due to multiple failed login attempts. Your account will be unlocked in 24 hours.",
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          message: "Incorrect password. Please try again.",
        },
        { status: 401 }
      );
    }

    // Get user settings to check 2FA status
    const userSettings = await prisma.userSettings.findUnique({
      where: { user_id: user.id },
    });

    // Check if 2FA is enabled
    if (userSettings?.two_factor_enabled) {
      // If 2FA code not provided, request it
      if (!twoFactorCode) {
        return NextResponse.json(
          {
            requires2FA: true,
            message: "Two-factor authentication code required",
          },
          { status: 200 }
        );
      }

      // Verify 2FA code
      const speakeasy = require("speakeasy");

      if (!userSettings.two_factor_secret) {
        return NextResponse.json(
          {
            message: "2FA configuration error. Please contact support.",
          },
          { status: 500 }
        );
      }

      const verified = speakeasy.totp.verify({
        secret: userSettings.two_factor_secret,
        encoding: "base32",
        token: twoFactorCode,
        window: 2,
      });

      if (!verified) {
        return NextResponse.json(
          {
            message: "Invalid two-factor authentication code",
            requires2FA: true,
          },
          { status: 401 }
        );
      }

      // Log successful 2FA login
      await prisma.securityLog.create({
        data: {
          user_id: user.id,
          action: "TWO_FACTOR_LOGIN",
          details: "User logged in with 2FA",
          ip_address:
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "unknown",
          user_agent: request.headers.get("user-agent") || "unknown",
        },
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    // Update last login and reset failed attempts
    await prisma.user.update({
      where: { id: user.id },
      data: {
        last_login_at: new Date(),
        failed_login_attempts: 0,
        account_locked_until: null,
      },
    });

    // Log security event
    await prisma.securityLog.create({
      data: {
        user_id: user.id,
        action: "LOGIN",
        details: "User logged in successfully",
        ip_address:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
        user_agent: request.headers.get("user-agent") || "unknown",
      },
    });

    // Return success response (exclude password)
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        message: "Login successful",
        user: userWithoutPassword,
        token: token,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        message: "Invalid request",
      },
      { status: 400 }
    );
  }
}
