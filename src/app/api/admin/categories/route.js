import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { canManageBlogs } from "@/lib/permissions";
import { z } from "zod";

async function getAuthenticatedUser() {
  const user = await requireAuth();
  if (!user && process.env.NODE_ENV === "development") {
    return await prisma.user.findFirst();
  }
  return user;
}

function slugify(text = "") {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

// GET /api/admin/categories - List all categories
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canManageBlogs(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { posts: true }
        }
      }
    });
    return NextResponse.json({ categories });
  } catch (err) {
    console.error("Fetch categories error:", err);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

const CreateCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
});

// POST /api/admin/categories - Create a category
export async function POST(req) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canManageBlogs(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = CreateCategorySchema.parse(body);

    const baseSlug = (data.slug && slugify(data.slug)) || slugify(data.name);
    
    // Check if category with this name or slug already exists
    const existing = await prisma.category.findFirst({
      where: {
        OR: [
          { name: { equals: data.name, mode: "insensitive" } },
          { slug: baseSlug }
        ]
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: "A category with this name or slug already exists." },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name: data.name.trim(),
        slug: baseSlug,
      }
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (err) {
    console.error("Create category error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
