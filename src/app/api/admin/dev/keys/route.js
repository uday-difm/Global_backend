import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkSitePermission } from "@/lib/apiAuth";
import crypto from "crypto";

export async function GET(req) {
  const auth = await checkSitePermission(req, "ADMIN");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const keys = await prisma.apiKey.findMany({
      where: { siteId: auth.siteId },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, apiKeys: keys });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const auth = await checkSitePermission(req, "ADMIN");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Key name is required" }, { status: 400 });
    }

    // Generate random secure API key
    const rawKey = `gkey_${crypto.randomBytes(24).toString("hex")}`;

    const apiKey = await prisma.apiKey.create({
      data: {
        siteId: auth.siteId,
        name,
        key: rawKey,
        isActive: true
      }
    });

    return NextResponse.json({ success: true, apiKey }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  const auth = await checkSitePermission(req, "ADMIN");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required to delete key" }, { status: 400 });
    }

    const key = await prisma.apiKey.findFirst({
      where: { id, siteId: auth.siteId }
    });

    if (!key) {
      return NextResponse.json({ error: "API Key not found" }, { status: 404 });
    }

    await prisma.apiKey.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "API key revoked successfully" });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}
