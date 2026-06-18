import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import speakeasy from "speakeasy";

// Add this helper function at the top of src/app/api/auth/2fa/route.js
async function getAuthenticatedUser() {
  const sessionUser = await requireAuth();
  if (sessionUser) return sessionUser;

  if (process.env.NODE_ENV === "development") {
    return await prisma.user.findFirst(); // Always gets the same first user
  }
  return null;
}

export async function POST(req) {
  const user = await getAuthenticatedUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const secret = speakeasy.generateSecret();

  // LOG: See what we are trying to save
  console.log("DEBUG: Saving secret for UserID:", user.id);

  const savedRecord = await prisma.twoFactor.upsert({
    where: { userId: user.id },
    update: { secret: secret.base32 },
    create: { userId: user.id, secret: secret.base32 },
  });

  // LOG: See what actually got saved
  console.log("DEBUG: Saved Record:", savedRecord);

  return NextResponse.json({ secret: secret.base32 });
}

export async function PATCH(req) {
  const user = await getAuthenticatedUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await req.json();
  const tf = await prisma.twoFactor.findUnique({ where: { userId: user.id } });

  if (!tf)
    return NextResponse.json({ error: "2FA not set up" }, { status: 400 });

  // TRIMMING IS KEY: Ensure no hidden whitespace from DB
  const secretFromDb = tf.secret.trim();
  console.log("DEBUG: Verifying against secret:", JSON.stringify(secretFromDb));
  console.log("DEBUG: Input token:", JSON.stringify(token.toString().trim()));

  const verified = speakeasy.totp.verify({
    secret: secretFromDb,
    encoding: "base32",
    token: token.toString().trim(), // Ensure input is string
    window: 2,
    algorith: "sha1",
  });

  if (verified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFAEnabled: true },
    });
    return NextResponse.json({ message: "2FA Enabled" });
  }
  const expectedToken = speakeasy.totp({
    secret: tf.secret.trim(),
    encoding: "base32",
    algorithm: "sha1",
    period: 30,
  });
  console.log("DEBUG: Server Expected Code:", expectedToken);
  console.log("DEBUG: User Provided Code:", token.toString().trim());

  return NextResponse.json({ error: "Invalid code" }, { status: 400 });
}
