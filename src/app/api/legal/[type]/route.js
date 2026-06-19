import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req, context) {
  try {
    const params = await context.params;
    const type = params?.type;
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");

    if (!siteId || !type) {
      return NextResponse.json({ error: "siteId and type parameters are required" }, { status: 400 });
    }

    const legalPage = await prisma.legalPage.findUnique({
      where: {
        siteId_type: { siteId, type }
      }
    });

    if (!legalPage) {
      return NextResponse.json({ error: "Legal page not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, legalPage });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}
