import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import sgMail from "@sendgrid/mail";
import { SecurityAction } from "@prisma/client";
import { validateEmail } from "@/lib/utils/emailValidation";

const SECRET_KEY = process.env.JWT_SECRET!;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY!;
const EMAIL_HOST = process.env.EMAIL_FROM as string;
const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Initialize SendGrid
sgMail.setApiKey(SENDGRID_API_KEY);

// Helper function to get client IP
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIP = req.headers.get("x-real-ip");
  const remoteAddress =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return realIP || remoteAddress;
}

// Generate password reset token
const generateResetToken = (email: string): string => {
  const payload = {
    email,
    type: "password_reset",
    timestamp: Date.now(),
  };

  // Token expires in 1 hour
  return jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });
};

// Send password reset email using SendGrid
const sendResetEmail = async (
  email: string,
  resetToken: string,
  userName: string
) => {
  const resetLink = `${FRONTEND_URL}/frontend/reset-password?token=${resetToken}`;

  const msg = {
    to: email,
    from: {
      email: EMAIL_HOST,
      name: "LegalynX Support",
    },
    subject: "Password Reset Instructions - LegalynX",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - LegalynX</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
            <h1 style="color: #0047AB; text-align: center;">LegalynX</h1>

            <div style="padding: 10px 30px;">
                <p style="font-size: 16px; margin-bottom: 15px; color: #000;">
                    We received a request to reset your password for your LegalynX account. If you didn't make this request, you can safely ignore this email.
                </p>
                <div style="text-align: center; margin: 20px 0;">
                    <a href="${resetLink}" style="display:inline-block; padding: 10px 20px; background-color:#0047AB; color: white; font-weight: bold; font-size: 14px; text-decoration: none; border-radius: 8px; margin-top: 20px;">Reset My Password</a>
                </div>
                
                <p style="font-size: 14px; color: #666; margin-top: 30px; text-align: center;">
                The link will expire in 1 hour for security reasons.
                </p>
            </div>
          
          <div style="background: #f8f8f8; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
            <p style="color: #6c757d; font-size: 12px; margin: 0 0 5px 0;">
              This email was sent by LegalynX system.
              Please do not reply to this email.
            </p>
            <p style="color: #6c757d; font-size: 12px; margin: 0 0 5px 0;">
              If you need help, contact our support team.
            </p>
            <p style="color: #6c757d; font-size: 12px; margin: 0;">
              &copy; 2025 LegalynX. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hello ${userName}!
      
      We received a request to reset your password for your LegalynX account.
      
      To reset your password, visit this link: ${resetLink}
      
      This link will expire in 1 hour for security reasons.
      
      If you didn't request this password reset, please ignore this email.
      
      Best regards,
      The LegalynX Team
      
      ---
      This email was sent by LegalynX system.
      © 2025 LegalynX. All rights reserved.
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Password reset email sent successfully to: ${email}`);
  } catch (error) {
    console.error("SendGrid error details:", error);
    if (error instanceof Error && "response" in error && error.response) {
      console.error("SendGrid response body:", (error.response as any).body);
    }
    throw error;
  }
};

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      );
    }

    // Validate email with trusted domain check
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      );
    }

    // Check if SendGrid API key is configured
    if (!SENDGRID_API_KEY) {
      console.error("SendGrid API key not configured");
      return NextResponse.json(
        { error: "Email service not configured. Please contact support." },
        { status: 500 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // ✅ NEW: Check if user exists and return appropriate response
    if (!user) {
      // Log attempt with non-existent email
      console.log(
        `⚠️ Password reset attempted for non-existent email: ${email}`
      );

      return NextResponse.json(
        {
          error: "No account found with that email address",
          userExists: false,
        },
        { status: 404 }
      );
    }

    // User exists, proceed with password reset
    try {
      // Generate reset token
      const resetToken = generateResetToken(email.toLowerCase());

      // Store reset token in database (optional - for additional security)
      try {
        await prisma.passwordResetToken.create({
          data: {
            user_id: user.id,
            token: resetToken,
            expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
            created_at: new Date(),
          },
        });
      } catch (tokenError) {
        console.log(
          "Password reset tokens table not found - migration may be needed"
        );
        // Continue without storing token in DB (JWT is still valid)
      }

      // Send reset email
      const userName = `${user.name || ""}`.trim() || "User";
      await sendResetEmail(email.toLowerCase(), resetToken, userName);

      // Log password reset request
      try {
        await prisma.securityLog.create({
          data: {
            user_id: user.id,
            details: `Password reset requested from IP: ${getClientIP(req)}`,
            action: SecurityAction.PASSWORD_CHANGE,
            user_agent: req.headers.get("user-agent") || "",
            created_at: new Date(),
          },
        });
      } catch (logError) {
        console.log("Failed to log password reset activity:", logError);
      }

      console.log(`✅ Password reset process completed for: ${email}`);

      return NextResponse.json({
        success: true,
        userExists: true,
        message:
          "Password reset instructions have been sent to your email. If you don't receive an email within a few minutes, please check your spam folder.",
      });
    } catch (emailError) {
      console.error("Failed to send reset email:", emailError);

      // Log failed email attempt
      try {
        await prisma.securityLog.create({
          data: {
            user_id: user.id,
            details: `${user.name || ""}`.trim(),
            action: SecurityAction.PASSWORD_CHANGE,
            user_agent: req.headers.get("user-agent") || "",
            created_at: new Date(),
          },
        });
      } catch (logError) {
        console.error("Failed to log email error:", logError);
      }

      return NextResponse.json(
        { error: "Failed to send reset email. Please try again later." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
}
