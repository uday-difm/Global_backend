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
        recaptchaToken: {
          label: "reCAPTCHA Token",
          type: "text",
        },
      },

      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        const secretKey = process.env.RECAPTCHA_SECRET_KEY;
        if (secretKey) {
          const recaptchaToken = credentials?.recaptchaToken;
          if (!recaptchaToken) {
            throw new Error("reCAPTCHA verification is required");
          }

          try {
            const verifyUrl = "https://www.google.com/recaptcha/api/siteverify";
            const queryParams = new URLSearchParams({
              secret: secretKey,
              response: recaptchaToken,
            });

            const verifyRes = await fetch(`${verifyUrl}?${queryParams.toString()}`, {
              method: "POST",
            });

            const verifyJson = await verifyRes.json();
            if (!verifyJson.success) {
              throw new Error("reCAPTCHA verification failed");
            }
          } catch (captchaErr) {
            throw new Error(captchaErr.message || "reCAPTCHA verification failed");
          }
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
      const now = Date.now();
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.globalRole = user.globalRole;
        token.lastActivity = now;
      }

      // Dynamic session timeout verification from database
      try {
        const activeSite = await prisma.site.findFirst({ where: { isActive: true } });
        if (activeSite) {
          const settings = await prisma.globalSettings.findUnique({
            where: { siteId: activeSite.id },
            select: { securityControls: true },
          });
          const timeoutMinutes = settings?.securityControls?.sessionTimeoutMinutes || 30;
          const timeoutMs = timeoutMinutes * 60 * 1000;

          if (token.lastActivity && now - token.lastActivity > timeoutMs) {
            token.error = "SessionExpired";
          } else {
            token.lastActivity = now;
          }
        }
      } catch (err) {
        console.error("JWT Session timeout verification error:", err);
      }

      return token;
    },

    async session({ session, token }) {
      if (token.error === "SessionExpired") {
        session.error = "SessionExpired";
        session.user = null;
        return session;
      }

      session.user = {
        id: token.id,
        email: token.email,
        globalRole: token.globalRole,
      };

      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
