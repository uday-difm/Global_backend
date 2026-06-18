import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { z } from "zod";

// Dev-friendly authenticated user helper
async function getAuthenticatedUser() {
  const user = await requireAuth();
  if (!user && process.env.NODE_ENV === "development") {
    // In dev, if no session, try to get the first user for convenience
    return await prisma.user.findFirst();
  }
  return user;
}

/* --------------------- GET (list services) --------------------- */
export async function GET(req) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const siteId = searchParams.get("siteId");

  if (!siteId) {
    return NextResponse.json({ error: "siteId required" }, { status: 400 });
  }

  const services = await prisma.service.findMany({
    where: { siteId },
    orderBy: { sortOrder: "asc" },
    include: {
      featuredImage: true,
    },
  });

  return NextResponse.json({ services });
}

/* --------------------- POST (create service) --------------------- */

// Request validation schema
const CreateServiceSchema = z.object({
  siteId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  price: z.string().optional(),
  ctaButtonText: z.string().optional(),
  ctaButtonLink: z.string().optional(),
  sortOrder: z.number().int().optional(),
  status: z.enum(["DRAFT", "ACTIVE"]).optional(),
  featuredImageId: z.string().optional(),
});

export async function POST(req) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = CreateServiceSchema.parse(body);

    const newService = await prisma.service.create({
      data: {
        siteId: data.siteId,
        title: data.title,
        description: data.description,
        price: data.price,
        ctaButtonText: data.ctaButtonText,
        ctaButtonLink: data.ctaButtonLink,
        sortOrder: data.sortOrder || 0, // Default to 0 if not provided
        status: data.status || "DRAFT",
        featuredImageId: data.featuredImageId,
      },
      include: {
        featuredImage: true,
      },
    });

    return NextResponse.json({ service: newService }, { status: 201 });
  } catch (err) {
    console.error("Create service error:", err);

    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: err.errors },
        { status: 400 },
      );
    }

    // Add specific Prisma error handling here if needed (e.g., unique constraints)
    // const code = err?.code;
    // if (code === "P2002") { ... }

    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 },
    );
  }
}
