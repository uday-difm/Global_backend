import Credentials from "next-auth/providers/credentials";

import bcrypt from "bcryptjs";

import prisma from "@/lib/prisma";

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

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user) {
          throw new Error("Invalid credentials");
        }

        if (!user.isActive) {
          throw new Error("Account disabled");
        }

        const validPassword = await bcrypt.compare(
          credentials.password,
          user.passwordHash,
        );

        if (!validPassword) {
          throw new Error("Invalid credentials");
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
