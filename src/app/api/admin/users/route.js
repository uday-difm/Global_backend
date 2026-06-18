import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { hasRole, ROLES } from "@/lib/rbac";
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
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  const sessionUser = await requireAuth();
  const isDev = process.env.NODE_ENV === "development";

  // FETCH REAL USER in development
  let user = sessionUser;
  if (isDev && !user) {
    user = await prisma.user.findFirst();
    // Fallback if DB is empty
    if (!user)
      return NextResponse.json(
        { error: "No users found in DB for dev bypass" },
        { status: 401 },
      );
  }

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const validatedData = UserSchema.parse(body);
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const newUser = await prisma.user.create({
      data: {
        email: validatedData.email,
        passwordHash: hashedPassword,
        globalRole: validatedData.globalRole,
      },
    });

    // NOW: user.id is safe because of our check above
    await logAction(null, user.id, "USER_CREATED", {
      email: validatedData.email,
    });

    const { passwordHash, ...userWithoutPassword } = newUser;
    return NextResponse.json({ user: userWithoutPassword }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("User creation error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
