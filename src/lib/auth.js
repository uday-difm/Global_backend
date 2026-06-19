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
        // 2. Add 'req' argument
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        console.log("Found user:", user);
        if (!user || !user.isActive) {
          throw new Error("Invalid credentials");
        }

        const validPassword = await bcrypt.compare(
          credentials.password,
          user.passwordHash,
        );

        if (!validPassword) {
          throw new Error("Invalid credentials");
        }

        // 3. Record the login
        try {
          const ip = req.headers?.["x-forwarded-for"] || "unknown";
          const agent = req.headers?.["user-agent"] || "unknown";
          await recordLogin(user.id, ip, agent);
        } catch (err) {
          console.error("Failed to record login history:", err);
        }

        return {
          id: user.id,
          email: user.email,
          globalRole: user.globalRole,
        };
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

  secret: process.env.NEXTAUTH_SECRET,
};
