import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkSitePermission } from "@/lib/apiAuth";
import { apiSuccess } from "@/core/errors";

export async function GET(req) {
  const auth = await checkSitePermission(req, "EDITOR");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where = { siteId: auth.siteId };
    if (status) {
      where.status = status;
    }

    const subscribers = await prisma.newsletter.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(apiSuccess({ subscribers }));
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const auth = await checkSitePermission(req, "EDITOR");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { email } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if already subscribed
    const existing = await prisma.newsletter.findFirst({
      where: { siteId: auth.siteId, email: email.trim().toLowerCase() },
    });

    if (existing) {
      // If unsubscribed, re-activate
      if (existing.status !== "active") {
        const updated = await prisma.newsletter.update({
          where: { id: existing.id },
          data: { status: "active" },
        });
        return NextResponse.json(apiSuccess({ subscriber: updated }), { status: 200 });
      }
      return NextResponse.json({ error: "Email already subscribed" }, { status: 409 });
    }

    const subscriber = await prisma.newsletter.create({
      data: {
        siteId: auth.siteId,
        email: email.trim().toLowerCase(),
        status: "active",
      },
    });

    return NextResponse.json(apiSuccess({ subscriber }), { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}
