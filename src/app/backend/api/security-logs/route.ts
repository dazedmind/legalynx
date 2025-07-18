"use server"
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
    // console.log("JWT Payload:", payload);

    // Find the user by ID (your login route creates 'userId' in the payload)
    const logs = await prisma.securityLog.findMany({
      where: { user_id: payload.userId }, // This matches your login route
      select: {
        id: true,
        user_id: true,
        action: true,
        details: true,
        ip_address: true,
        created_at: true,
        user: {
            select: {
                name: true,
                email: true
            }
        }
      }
    });

    if (!logs) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Simple response - just return the user data as-is
    await prisma.$disconnect();
    return NextResponse.json({ logs: logs });

  } catch (err) {
    console.error("Error verifying token:", err);
    await prisma.$disconnect();
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 403 }
    );
  }
}