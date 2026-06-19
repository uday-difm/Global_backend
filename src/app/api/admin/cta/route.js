import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkSitePermission } from "@/lib/apiAuth";

export async function GET(req) {
  const auth = await checkSitePermission(req, "EDITOR");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const settings = await prisma.globalSettings.findUnique({
      where: { siteId: auth.siteId },
      select: { ctaConfig: true }
    });

    return NextResponse.json({ success: true, ctaConfig: settings?.ctaConfig || null });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  const auth = await checkSitePermission(req, "EDITOR");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();

    const settings = await prisma.globalSettings.upsert({
      where: { siteId: auth.siteId },
      update: { ctaConfig: body },
      create: { siteId: auth.siteId, ctaConfig: body }
    });

    return NextResponse.json({ success: true, ctaConfig: settings.ctaConfig });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}
