import { NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { requireAuth } from "@/lib/requireAuth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/core/errors";

async function getAuthenticatedUser() {
  const sessionUser = await requireAuth();
  if (sessionUser) return sessionUser;

  if (process.env.NODE_ENV === "development") {
    return await prisma.user.findFirst();
  }
  return null;
}

export async function POST(req) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { secret } = await authService.generate2FASecret(user.id);
    return NextResponse.json({ secret });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await req.json();
    await authService.verifyAndEnable2FA(user.id, token);
    return NextResponse.json({ message: "2FA Enabled" });
  } catch (err) {
    return handleApiError(err);
  }
}
