import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkSitePermission } from "@/lib/apiAuth";
import { z } from "zod";

const FaqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  page: z.string().nullable().optional(),
  sortOrder: z.number().optional().default(0),
  showHide: z.boolean().optional().default(true),
  schemaMarkup: z.boolean().optional().default(false)
});

export async function GET(req) {
  const auth = await checkSitePermission(req, "EDITOR");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const faqs = await prisma.faq.findMany({
      where: { siteId: auth.siteId },
      orderBy: { sortOrder: "asc" }
    });

    return NextResponse.json({ success: true, faqs });
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
    const parsed = FaqSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.errors }, { status: 400 });
    }

    const faq = await prisma.faq.create({
      data: {
        siteId: auth.siteId,
        ...parsed.data
      }
    });

    return NextResponse.json({ success: true, faq }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}
