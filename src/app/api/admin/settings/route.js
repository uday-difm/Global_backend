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
      select: { websiteSettings: true }
    });

    return NextResponse.json({ success: true, websiteSettings: settings?.websiteSettings || null });
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
      update: { websiteSettings: body },
      create: { siteId: auth.siteId, websiteSettings: body }
    });

    return NextResponse.json({ success: true, websiteSettings: settings.websiteSettings });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}
