import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkSitePermission } from "@/lib/apiAuth";

export async function GET(req, context) {
  const params = await context.params;
  const type = params?.type;
  const auth = await checkSitePermission(req, "EDITOR");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const legalPage = await prisma.legalPage.findUnique({
      where: {
        siteId_type: { siteId: auth.siteId, type }
      }
    });

    return NextResponse.json({ success: true, legalPage: legalPage || null });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}

export async function PUT(req, context) {
  const params = await context.params;
  const type = params?.type;
  const auth = await checkSitePermission(req, "EDITOR");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "title and content are required" }, { status: 400 });
    }

    const legalPage = await prisma.legalPage.upsert({
      where: {
        siteId_type: { siteId: auth.siteId, type }
      },
      update: {
        title,
        content,
        lastUpdated: new Date()
      },
      create: {
        siteId: auth.siteId,
        type,
        title,
        content,
        lastUpdated: new Date()
      }
    });

    return NextResponse.json({ success: true, legalPage });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}
