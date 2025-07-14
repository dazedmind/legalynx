import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/prisma";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!

const authOption: NextAuthOptions = {
    session:{
        strategy: "jwt",
    },
    providers: [
        GoogleProvider({
            clientId: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if(!profile?.email) {
                throw new Error("Missing email")
            }
            await prisma.user.upsert({
              where: {
                email: profile.email,
              },
              create: {
                email: profile.email,
                name: profile.name,
                password: "",
                email_verified: false,
                subscription_status: "BASIC",
                profile_picture: profile.image,
                status: "ACTIVE",
                job_title: "",
              },
              update: {
                name: profile.name,
              },
            })

            return true
        },
     
    }
}

const handler = NextAuth(authOption)
export { handler as GET, handler as POST }