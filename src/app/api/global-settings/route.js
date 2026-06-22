import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSiteId } from "@/lib/siteGuard";
import { validateIntegrationKey } from "@/lib/apiAuth";

export async function GET(request) {
  try {
    let siteId;
    try {
      siteId = getSiteId(request);
    } catch (e) {
      return NextResponse.json(
        { error: e.message || "Missing siteId" },
        { status: 400 },
      );
    }

    const auth = await validateIntegrationKey(request, siteId);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const settings = await prisma.globalSettings.findFirst({
      where: { siteId },
      select: {
        id: true,
        header: true,
        footer: true,
        analytics: true,
        scripts: true,
        websiteSettings: true,
        navigation: true,
        contactDetails: true,
        compliance: true,
        performanceConfig: true,
        updatedAt: true,
      },
    });

    const responseHeaders = {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    };

    if (!settings) {
      return NextResponse.json({
        ok: true,
        settings: {
          header: null,
          footer: null,
          analytics: null,
          scripts: null,
        },
      }, {
        headers: responseHeaders,
      });
    }

    return NextResponse.json({ ok: true, settings }, {
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("GET /api/global-settings error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

