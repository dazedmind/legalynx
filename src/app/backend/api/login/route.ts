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
          message: "Invalid email or password",
        },
        { status: 401 }
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
      return NextResponse.json(
        {
          message: "Invalid email or password",
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

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
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
