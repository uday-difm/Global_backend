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

/* --------------------- GET (list posts) --------------------- */
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

  const posts = await prisma.post.findMany({
    where: { siteId },
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: {
          email: true,
          id: true,
        },
      },
      categories: true,
      tags: true,
    },
  });

  return NextResponse.json({ posts });
}

/* --------------------- POST (create post) --------------------- */

// Request validation schema
const CreatePostSchema = z.object({
  siteId: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().optional(),
  content: z.any().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  // SEO fields
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  // Relationships
  categoryIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
});

// Slug generation helpers
function slugify(text = "") {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

async function generateUniquePostSlug(siteId, baseSlug) {
  let candidate = baseSlug;
  let i = 0;
  while (
    await prisma.post.findUnique({
      where: { siteId_slug: { siteId, slug: candidate } },
    })
  ) {
    i += 1;
    candidate = `${baseSlug}-${i}`;
  }
  return candidate;
}

export async function POST(req) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = CreatePostSchema.parse(body);

    const baseSlug =
      (data.slug && slugify(data.slug)) || slugify(data.title || "new-post");
    const slug = await generateUniquePostSlug(data.siteId, baseSlug);

    const newPost = await prisma.post.create({
      data: {
        siteId: data.siteId,
        title: data.title,
        slug,
        content: data.content,
        status: data.status || "DRAFT",
        authorId: user.id, // Assign the current user as the author
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        categories: data.categoryIds
          ? { connect: data.categoryIds.map((id) => ({ id })) }
          : undefined,
        tags: data.tagIds
          ? { connect: data.tagIds.map((id) => ({ id })) }
          : undefined,
      },
      include: {
        categories: true,
        tags: true,
      },
    });

    return NextResponse.json({ post: newPost }, { status: 201 });
  } catch (err) {
    console.error("Create post error:", err);

    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: err.errors },
        { status: 400 },
      );
    }

    const code = err?.code;
    if (code === "P2002") {
      return NextResponse.json(
        { error: "A post with this slug already exists for this site." },
        { status: 409 },
      );
    }
    if (code === "P2025") {
      return NextResponse.json(
        { error: "One or more category or tag IDs were not found." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 },
    );
  }
}
