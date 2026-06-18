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

/* --------------------- GET (single post) --------------------- */
export async function GET(req, { params: rawParams }) {
  // Await params
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actualParams = await rawParams;
  const { postId } = actualParams;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      categories: true,
      tags: true,
      author: { select: { id: true, email: true } },
      featuredImage: true,
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json({ post });
}

/* --------------------- PATCH (update post) --------------------- */

// Using .partial() to make all fields optional for updates
const UpdatePostSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.any().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  featuredImageId: z.string().nullable().optional(),
  categoryIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
});

export async function PATCH(req, { params: rawParams }) {
  // Await params
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actualParams = await rawParams;
  const { postId } = actualParams;

  try {
    const body = await req.json();
    const data = UpdatePostSchema.parse(body);

    const postToUpdate = await prisma.post.findUnique({
      where: { id: postId },
    });
    if (!postToUpdate) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        title: data.title,
        content: data.content,
        status: data.status,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        featuredImageId: data.featuredImageId,
        categories: data.categoryIds
          ? { set: data.categoryIds.map((id) => ({ id })) }
          : undefined,
        tags: data.tagIds
          ? { set: data.tagIds.map((id) => ({ id })) }
          : undefined,
      },
      include: {
        categories: true,
        tags: true,
      },
    });

    return NextResponse.json({ post: updatedPost });
  } catch (err) {
    console.error("Update post error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: err.errors },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 },
    );
  }
}

/* --------------------- DELETE (single post) --------------------- */
export async function DELETE(req, { params: rawParams }) {
  // Await params
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actualParams = await rawParams;
  const { postId } = actualParams;

  const postToDelete = await prisma.post.findUnique({ where: { id: postId } });
  if (!postToDelete) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  await prisma.post.delete({
    where: { id: postId },
  });

  return NextResponse.json(
    { message: "Post deleted successfully" },
    { status: 200 },
  );
}
