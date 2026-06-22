import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSiteId } from "@/lib/siteGuard";
import { handleApiError } from "@/core/errors";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const siteId = getSiteId(req);
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId") || undefined;

    const posts = await prisma.post.findMany({
      where: {
        siteId,
        status: "PUBLISHED",
        deletedAt: null,
        publishedAt: { lte: new Date() },
        ...(categoryId ? { categories: { some: { id: categoryId } } } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        categories: true,
        tags: true,
        author: { select: { id: true, email: true } },
        featuredImage: true,
      },
    });

    return NextResponse.json({ success: true, posts });
  } catch (err) {
    return handleApiError(err);
  }
}
