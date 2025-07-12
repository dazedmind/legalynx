"use server"
import { prisma } from "@/lib/prisma";
import bcrypt from 'bcryptjs';
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const { email, password } = await request.json();
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: { email, password: hashedPassword }
    })

    if (!email || !password) {
        throw new Error("Missing required fields.");
    }

    if (user) {
        return NextResponse.json({ 
            message: "User created successfully" 
        }, { status: 201 });
    } else {
        return NextResponse.json({ message: "User creation failed" }, { status: 500 });
    }
    return NextResponse.json(user)
}