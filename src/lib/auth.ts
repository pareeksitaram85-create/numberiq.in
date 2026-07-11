import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { timingSafeEqual } from "crypto";

// Constant-time string comparison to prevent timing attacks on the
// credentials check. Returns false on length mismatch without leaking
// where the mismatch occurred.
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

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
      name: "Admin Account",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Admin credentials must be configured via environment variables.
        // In development only, fall back to a local demo account so the
        // dashboard can be tested without configuring secrets.
        let adminEmail = process.env.ADMIN_EMAIL;
        let adminPassword = process.env.ADMIN_PASSWORD;
        if ((!adminEmail || !adminPassword) && process.env.NODE_ENV !== "production") {
          adminEmail = "admin@numberiq.in";
          adminPassword = "admin123";
        }
        if (!adminEmail || !adminPassword) return null;

        if (
          safeCompare(credentials.email.toLowerCase(), adminEmail.toLowerCase()) &&
          safeCompare(credentials.password, adminPassword)
        ) {
          return {
            id: "admin",
            name: "Admin",
            email: adminEmail,
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
