import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");

    if (!siteId) {
      return NextResponse.json(
        { error: "siteId is required" },
        { status: 400 },
      );
    }

    const settings = await prisma.globalSettings.findUnique({
      where: { siteId },
      select: { ctaConfig: true },
    });

    return NextResponse.json({
      success: true,
      ctaConfig: settings?.ctaConfig || null,
    });
  } catch (err) {
    console.error("GET /api/cta error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
