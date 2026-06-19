import { NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { handleApiError } from "@/core/errors";

export async function POST(req) {
  try {
    const body = await req.json();
    await authService.requestPasswordReset(body.email);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
