import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkSitePermission } from "@/lib/apiAuth";
import { z } from "zod";

const FaqUpdateSchema = z.object({
  question: z.string().optional(),
  answer: z.string().optional(),
  page: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
  showHide: z.boolean().optional(),
  schemaMarkup: z.boolean().optional()
});

export async function GET(req, context) {
  const params = await context.params;
  const id = params?.id;
  const auth = await checkSitePermission(req, "EDITOR");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const faq = await prisma.faq.findFirst({
      where: { id, siteId: auth.siteId }
    });

    if (!faq) {
      return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, faq });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}

export async function PATCH(req, context) {
  const params = await context.params;
  const id = params?.id;
  const auth = await checkSitePermission(req, "EDITOR");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const faq = await prisma.faq.findFirst({
      where: { id, siteId: auth.siteId }
    });

    if (!faq) {
      return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = FaqUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.errors }, { status: 400 });
    }

    const updated = await prisma.faq.update({
      where: { id },
      data: parsed.data
    });

    return NextResponse.json({ success: true, faq: updated });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  const params = await context.params;
  const id = params?.id;
  const auth = await checkSitePermission(req, "EDITOR");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const faq = await prisma.faq.findFirst({
      where: { id, siteId: auth.siteId }
    });

    if (!faq) {
      return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    }

    await prisma.faq.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "FAQ deleted successfully" });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}
