import Credentials from "next-auth/providers/credentials";

import bcrypt from "bcryptjs";

import prisma from "@/lib/prisma";
import { recordLogin } from "./audit";

export const authOptions = {
  session: {
    strategy: "jwt",
  },

  providers: [
    Credentials({
      name: "credentials",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        try {
          const { authService } = await import("@/services/auth.service");
          const user = await authService.authenticate(
            credentials.email,
            credentials.password,
            req.headers || {}
          );
          return user;
        } catch (err) {
          throw new Error(err.message || "Invalid credentials");
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.globalRole = user.globalRole;
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.email = token.email;
      session.user.globalRole = token.globalRole;

      return session;
    },
  },

  pages: {
    signIn: "/",
    error: "/",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
