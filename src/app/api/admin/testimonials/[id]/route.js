import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkSitePermission } from "@/lib/apiAuth";
import { z } from "zod";

const TestimonialUpdateSchema = z.object({
  clientName: z.string().optional(),
  clientImage: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  content: z.string().optional(),
  showHide: z.boolean().optional(),
  sortOrder: z.number().optional()
});

export async function GET(req, context) {
  const params = await context.params;
  const id = params?.id;
  const auth = await checkSitePermission(req, "EDITOR");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const testimonial = await prisma.testimonial.findFirst({
      where: { id, siteId: auth.siteId }
    });

    if (!testimonial) {
      return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, testimonial });
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
    const testimonial = await prisma.testimonial.findFirst({
      where: { id, siteId: auth.siteId }
    });

    if (!testimonial) {
      return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = TestimonialUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.errors }, { status: 400 });
    }

    const updated = await prisma.testimonial.update({
      where: { id },
      data: parsed.data
    });

    return NextResponse.json({ success: true, testimonial: updated });
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
    const testimonial = await prisma.testimonial.findFirst({
      where: { id, siteId: auth.siteId }
    });

    if (!testimonial) {
      return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
    }

    await prisma.testimonial.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Testimonial deleted successfully" });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}
