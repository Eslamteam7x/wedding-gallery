import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { readJSON, PATHS } from "./github-storage";

declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    user: {
      id: string;
      role: string;
      name?: string | null;
      email?: string | null;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: string;
    id?: string;
  }
}

const FALLBACK_SECRET = "15994605005b6a5c68b265854f5d2936734c171adf03552ac6ae4d9bd62dc81a";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || FALLBACK_SECRET,
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Fallback: hardcoded admin (works even without GitHub token on Vercel)
        if (credentials.email === "admin@wedding.com" && credentials.password === "admin123") {
          return { id: "seed-admin-001", email: "admin@wedding.com", name: "Admin", role: "ADMIN" };
        }

        try {
          const users = await readJSON<any[]>(PATHS.USERS);
          if (!Array.isArray(users) || users.length === 0) {
            console.error("No users found in storage");
            return null;
          }

          const user = users.find(
            (u: any) => u.email === credentials.email
          );
          if (!user) return null;

          const valid = await compare(credentials.password as string, user.password);
          if (!valid) return null;

          return { id: user.id, email: user.email, name: user.name, role: user.role };
        } catch (err: any) {
          console.error("Auth error:", err?.message || err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
