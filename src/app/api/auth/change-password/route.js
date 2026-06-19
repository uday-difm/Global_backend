import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import bcrypt from "bcryptjs";
import { logAction } from "@/lib/audit";

export async function POST(req) {
  const sessionUser = await requireAuth();
  const isDev = process.env.NODE_ENV === "development";
  let user = sessionUser;
  if (!user && isDev) {
    // In dev, get the first available user for convenience
    user = await prisma.user.findFirst();
  }

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

  // Dev Note: If using dev bypass, skip password check or set a fixed password
  if (!isDev && !(await bcrypt.compare(currentPassword, dbUser.passwordHash))) {
    return NextResponse.json({ error: "Invalid password" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 10) },
  });

  await logAction(null, user.id, "PASSWORD_CHANGE");
  return NextResponse.json({ message: "Success" });
}
