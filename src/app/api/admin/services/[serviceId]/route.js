import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { z } from "zod";

// Dev-friendly authenticated user helper
async function getAuthenticatedUser() {
  const user = await requireAuth();
  if (!user && process.env.NODE_ENV === "development") {
    return await prisma.user.findFirst();
  }
  return user;
}

/* --------------------- GET (single service) --------------------- */
export async function GET(req, { params: rawParams }) {
  // Await params
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actualParams = await rawParams;
  const { serviceId } = actualParams;

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      featuredImage: true,
    },
  });

  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  return NextResponse.json({ service });
}

/* --------------------- PATCH (update service) --------------------- */

// Using .partial() to make all fields optional for updates
const UpdateServiceSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.string().optional(),
  ctaButtonText: z.string().optional(),
  ctaButtonLink: z.string().optional(),
  sortOrder: z.number().int().optional(),
  status: z.enum(["DRAFT", "ACTIVE"]).optional(),
  featuredImageId: z.string().nullable().optional(),
});

export async function PATCH(req, { params: rawParams }) {
  // Await params
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actualParams = await rawParams;
  const { serviceId } = actualParams;

  try {
    const body = await req.json();
    const data = UpdateServiceSchema.parse(body);

    const serviceToUpdate = await prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!serviceToUpdate) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        ctaButtonText: data.ctaButtonText,
        ctaButtonLink: data.ctaButtonLink,
        sortOrder: data.sortOrder,
        status: data.status,
        featuredImageId: data.featuredImageId,
      },
      include: {
        featuredImage: true,
      },
    });

    return NextResponse.json({ service: updatedService });
  } catch (err) {
    console.error("Update service error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: err.errors },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 },
    );
  }
}

/* --------------------- DELETE (single service) --------------------- */
export async function DELETE(req, { params: rawParams }) {
  // Await params
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actualParams = await rawParams;
  const { serviceId } = actualParams;

  const serviceToDelete = await prisma.service.findUnique({
    where: { id: serviceId },
  });
  if (!serviceToDelete) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  await prisma.service.delete({
    where: { id: serviceId },
  });

  return NextResponse.json(
    { message: "Service deleted successfully" },
    { status: 200 },
  );
}
