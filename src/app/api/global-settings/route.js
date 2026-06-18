import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const siteId = url.searchParams.get("siteId");

    if (!siteId) {
      return NextResponse.json(
        { error: "Missing siteId query parameter" },
        { status: 400 },
      );
    }

    const settings = await prisma.globalSettings.findFirst({
      where: { siteId },
      select: {
        id: true,
        header: true,
        footer: true,
        analytics: true,
        scripts: true,
        updatedAt: true,
      },
    });

    if (!settings) {
      return NextResponse.json({
        ok: true,
        settings: {
          header: null,
          footer: null,
          analytics: null,
          scripts: null,
        },
      });
    }

    return NextResponse.json({ ok: true, settings });
  } catch (err) {
    console.error("GET /api/global-settings error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
