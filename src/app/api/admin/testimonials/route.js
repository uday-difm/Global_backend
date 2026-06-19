import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkSitePermission } from "@/lib/apiAuth";
import { z } from "zod";

const TestimonialSchema = z.object({
  clientName: z.string().min(1),
  clientImage: z.string().optional(),
  rating: z.number().min(1).max(5).optional().default(5),
  content: z.string().min(1),
  showHide: z.boolean().optional().default(true),
  sortOrder: z.number().optional().default(0)
});

export async function GET(req) {
  const auth = await checkSitePermission(req, "EDITOR");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { siteId: auth.siteId },
      orderBy: { sortOrder: "asc" }
    });

    return NextResponse.json({ success: true, testimonials });
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
    const parsed = TestimonialSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.errors }, { status: 400 });
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        siteId: auth.siteId,
        ...parsed.data
      }
    });

    return NextResponse.json({ success: true, testimonial }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}
