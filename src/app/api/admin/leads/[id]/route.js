import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkSitePermission } from "@/lib/apiAuth";
import { z } from "zod";

const LeadUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  serviceInterest: z.string().optional(),
  sourcePage: z.string().optional(),
  status: z.enum(["new", "contacted", "qualified", "closed"]).optional(),
  notes: z.string().optional()
});

export async function GET(req, context) {
  const params = await context.params;
  const id = params?.id;
  const auth = await checkSitePermission(req, "EDITOR");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const lead = await prisma.lead.findFirst({
      where: { id, siteId: auth.siteId }
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, lead });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}

export async function PUT(req, context) {
  const params = await context.params;
  const id = params?.id;
  const auth = await checkSitePermission(req, "EDITOR");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const lead = await prisma.lead.findFirst({
      where: { id, siteId: auth.siteId }
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = LeadUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.errors }, { status: 400 });
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: parsed.data
    });

    return NextResponse.json({ success: true, lead: updated });
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
    const lead = await prisma.lead.findFirst({
      where: { id, siteId: auth.siteId }
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    await prisma.lead.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Lead deleted successfully" });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}
