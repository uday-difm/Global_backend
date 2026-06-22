import { NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { handleApiError } from "@/core/errors";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    // Authenticate user credentials first (checks password, logs audit history)
    const user = await authService.authenticate(email, password, req.headers || {});

    // Return if 2FA verification is required for this account
    return NextResponse.json({
      success: true,
      twoFaRequired: user.twoFAEnabled
    });
  } catch (err) {
    return handleApiError(err);
  }
}
