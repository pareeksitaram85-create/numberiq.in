import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Demo Account",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@numberiq.in" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Fallback demo user for testing without direct live DB migrations
        if (
          credentials?.email === "admin@numberiq.in" &&
          credentials?.password === "admin123"
        ) {
          return {
            id: "demo-admin",
            name: "Demo Admin",
            email: "admin@numberiq.in",
            role: "ADMIN",
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};
