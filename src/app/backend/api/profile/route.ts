// src/app/backend/api/profile/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET;

export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "No token provided" }, { status: 401 });
  }

  try {
    // Verify the JWT token
    const payload: any = jwt.verify(token, SECRET_KEY!);
    console.log("JWT Payload:", payload);

    // Find the user by ID (your login route creates 'userId' in the payload)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }, // This matches your login route
      select: {
        id: true,
        email: true,
        name: true,
        email_verified: true,
        status: true,
        subscription_status: true,
        profile_picture: true,
        job_title: true,
        created_at: true,
        last_login_at: true,
        // Don't select password for security
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Simple response - just return the user data as-is
    await prisma.$disconnect();
    return NextResponse.json(user);

  } catch (err) {
    console.error("Error verifying token:", err);
    await prisma.$disconnect();
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 403 }
    );
  }
}

// PATCH for updating profile (simplified)
export async function PATCH(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "No token provided" }, { status: 401 });
  }

  try {
    const payload: any = jwt.verify(token, SECRET_KEY!);
    const body = await req.json();
    
    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        name: body.name,
        job_title: body.job_title,
        profile_picture: body.profile_picture,
        // Add other fields as needed
      },
      select: {
        id: true,
        email: true,
        name: true,
        email_verified: true,
        status: true,
        subscription_status: true,
        profile_picture: true,
        job_title: true,
        created_at: true,
        last_login_at: true,
      }
    });

    await prisma.$disconnect();
    return NextResponse.json(updatedUser);

  } catch (err) {
    console.error("Error updating profile:", err);
    await prisma.$disconnect();
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}