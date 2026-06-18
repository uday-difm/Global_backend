import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { canAssignRole, ROLES } from "@/lib/rbac";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { logAction } from "@/lib/audit";
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const UserSchema = z.object({
  email: z.string().regex(emailRegex, { message: "Invalid email format" }),
  password: z.string().min(6),
  globalRole: z
    .enum(["SUPERADMIN", "ADMIN", "EDITOR", "AUTHOR", "VIEWER"])
    .optional()
    .default("VIEWER"),
});

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        globalRole: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch users", error },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  // Authenticate caller (server authoritative)
  const authUser = await requireAuth();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Read and validate request body once
    const body = await req.json();
    const validated = UserSchema.parse(body);

    // Enforce role assignment policy
    // canAssignRole should return true if caller can assign the requested role
    if (!canAssignRole(authUser.globalRole, validated.globalRole)) {
      return NextResponse.json(
        { error: "Forbidden: cannot assign role higher than your own" },
        { status: 403 },
      );
    }

    // Create user
    const hashedPassword = await bcrypt.hash(validated.password, 10);
    const newUser = await prisma.user.create({
      data: {
        email: validated.email,
        passwordHash: hashedPassword,
        globalRole: validated.globalRole,
      },
    });

    // Audit: log that authUser created this new user
    try {
      await logAction(null, authUser.id, "USER_CREATED", {
        targetUserId: newUser.id,
        email: validated.email,
      });
    } catch (logErr) {
      console.error("Failed to write audit log:", logErr);
    }

    const { passwordHash, ...userWithoutPassword } = newUser;
    return NextResponse.json({ user: userWithoutPassword }, { status: 201 });
  } catch (error) {
    // Validation error
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    // Prisma unique constraint (email)
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Email already exists", meta: error.meta },
        { status: 409 },
      );
    }

    console.error("User creation error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: String(error?.message || error),
      },
      { status: 500 },
    );
  }
}
