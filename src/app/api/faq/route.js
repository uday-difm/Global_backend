import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");
    const page = searchParams.get("page");

    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    const where = { siteId, showHide: true };
    if (page) {
      where.page = page;
    }

    const faqs = await prisma.faq.findMany({
      where,
      orderBy: { sortOrder: "asc" }
    });

    return NextResponse.json({ success: true, faqs });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}
