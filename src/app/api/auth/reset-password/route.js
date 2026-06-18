import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// PATCH: Reset password with a token (token verification logic would go here)
export async function PATCH(req) {
  const { email, newPassword } = await req.json();

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { email },
    data: { passwordHash: hashedPassword },
  });

  return NextResponse.json({ message: "Password reset successful" });
}
