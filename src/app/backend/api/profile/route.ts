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
    const payload: any = jwt.verify(token, SECRET_KEY!);
    console.log("JWT Payload:", payload);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        email_verified: true, // This will automatically map from email_verified
        status: true,
        profile_picture: true, // This will automatically map from profile_picture
        job_title: true, // This will automatically map from job_title
        created_at: true, // This will automatically map from created_at
        last_login_at: true, // This will automatically map from last_login_at
        
        // Only include subscription if the model exists
        subscription: {
          select: {
            plan_type: true, // This will automatically map from plan_type
            is_active: true, // This will automatically map from is_active
            tokens_used: true, // This will automatically map from tokens_used
            token_limit: true, // This will automatically map from token_limit
            days_remaining: true, // This will automatically map from days_remaining
            billing_date: true, // This will automatically map from billing_date
            auto_renew: true, // This will automatically map from auto_renew
            price: true,
            currency: true,
            created_at: true, // This will automatically map from created_at
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("User found:", user);
    return NextResponse.json(user);

  } catch (err) {
    console.error("Error verifying token or fetching user:", err);
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
        subscription: true,
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