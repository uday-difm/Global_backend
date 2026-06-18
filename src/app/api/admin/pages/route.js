import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { z } from "zod";

// Dev-friendly authenticated user helper (keeps parity with other admin routes)
async function getAuthenticatedUser() {
  const user = await requireAuth();
  if (!user && process.env.NODE_ENV === "development") {
    return await prisma.user.findFirst();
  }
  return user;
}

/* --------------------- GET (list pages) --------------------- */
export async function GET(req) {
  const user = await getAuthenticatedUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const siteId = searchParams.get("siteId");

  if (!siteId)
    return NextResponse.json({ error: "siteId required" }, { status: 400 });

  const pages = await prisma.page.findMany({
    where: { siteId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ pages });
}

/* --------------------- POST (create page) --------------------- */

// request validation schema
const CreatePageSchema = z.object({
  siteId: z.string().min(1),
  title: z.string().min(1),
  // slug optional: if omitted we'll generate one from title
  slug: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

// slug helpers
function slugify(text = "") {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

// Generates a unique slug for the site by appending -1, -2, ... when collisions occur
async function generateUniqueSlug(siteId, baseSlug) {
  let candidate = baseSlug;
  let i = 0;
  // Prisma composite unique name follows pattern siteId_slug for @@unique([siteId, slug])
  while (
    await prisma.page.findUnique({
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
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = CreatePageSchema.parse(body);

    const baseSlug =
      (data.slug && slugify(data.slug)) || slugify(data.title || "page");
    const slug = await generateUniqueSlug(data.siteId, baseSlug);

    const newPage = await prisma.page.create({
      data: {
        siteId: data.siteId,
        title: data.title,
        slug,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
      },
    });

    return NextResponse.json({ page: newPage }, { status: 201 });
  } catch (err) {
    console.error("Create page error:", err);

    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: err.errors },
        { status: 400 },
      );
    }

    // Prisma known errors typically have .code
    const code = err?.code;
    if (code === "P2002") {
      return NextResponse.json(
        { error: "Slug already exists for this site", meta: err.meta },
        { status: 409 },
      );
    }
    if (code === "P2003") {
      return NextResponse.json(
        {
          error: "Foreign key constraint failed (invalid siteId?)",
          meta: err.meta,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create page", message: err?.message },
      { status: 500 },
    );
  }
}
