import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "./prisma"

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      email_verified: boolean;
      subscription: {
        plan_type: 'BASIC' | 'STANDARD' | 'PREMIUM';
        created_at: Date;
        billing_date: Date;
        days_remaining: number;
        tokens_used: number;
        token_limit: number;
        is_active: boolean;
        auto_renew: boolean;
      };
      profile_picture?: string | null;
    }
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("SignIn callback:", { user, account, profile });
      
      if (account?.provider === "google") {
        try {
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          });

          if (!existingUser) {
            // Create new user
            await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name || '',
                email_verified: true,
                status: 'ACTIVE',
                profile_picture: user.image || null,
                password: '',
                subscription: {
                  create: {
                    plan_type: 'BASIC',
                    created_at: new Date(),
                    billing_date: new Date(),
                    days_remaining: 30,
                    tokens_used: 0,
                    token_limit: 10000,
                    is_active: true,
                    auto_renew: true,
                  }
                }
              }
            });
            console.log("New user created:", user.email);
          } else {
            // Update existing user
            await prisma.user.update({
              where: { email: user.email! },
              data: { 
                email_verified: true,
                profile_picture: user.image || existingUser.profile_picture,
                name: user.name || existingUser.name,
              }
            });
            console.log("Existing user updated:", user.email);
          }

          return true;
        } catch (error) {
          console.error("Database error in signIn callback:", error);
          return false;
        }
      }
      return true;
    },
    
    async jwt({ token, user, account }) {
      console.log("JWT callback:", { token, user, account });
      
      if (account && user) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { subscription: true }
          });
          
          if (dbUser) {
            token.userId = dbUser.id;
            token.email = dbUser.email;
            token.emailVerified = dbUser.email_verified;
            token.subscription = dbUser.subscription as any;
            token.name = dbUser.name;
            token.picture = dbUser.profile_picture;
          }
        } catch (error) {
          console.error("Database error in JWT callback:", error);
        }
      }
      return token;
    },
    
    async session({ session, token }) {
      console.log("Session callback:", { session, token });
      
      if (token) {
        session.user!.id = token.userId as string;
        session.user!.email = token.email as string;
        session.user!.email_verified = token.emailVerified as boolean;
        session.user!.subscription = token.subscription as any;
        session.user!.name = token.name as string;
        session.user!.profile_picture = token.picture as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/frontend/login',
    error: '/frontend/auth/error', // Create this page
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development', // Enable debug logs
}