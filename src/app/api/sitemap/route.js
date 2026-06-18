import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/sitemap
 * Optional query: ?siteId=<SITE_ID>
 * Returns: [{ url, lastModified }]
 */
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const siteId = url.searchParams.get("siteId");

    const where = siteId
      ? { siteId, status: "PUBLISHED" }
      : { status: "PUBLISHED" };

    const pages = await prisma.page.findMany({
      where,
      select: {
        slug: true,
        updatedAt: true,
        // publishedAt may not exist in your schema — we use updatedAt
      },
      orderBy: { updatedAt: "desc" },
    });

    const items = pages.map((p) => {
      const slug = String(p.slug || "/");
      const urlPath = slug.startsWith("/") ? slug : `/${slug}`;
      const lastModified = p.updatedAt;
      return {
        url: urlPath,
        lastModified: lastModified ? lastModified.toISOString() : null,
      };
    });

    return NextResponse.json(items);
  } catch (err) {
    console.error("GET /api/sitemap error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
