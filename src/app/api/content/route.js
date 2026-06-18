import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 GET /api/content?siteId=...&slug=/about
 Response:
 {
   page: { id, title, slug, status, seo: {...}, jsonLd: string|null, ... },
   sections: [ { id, type, order, isVisible, content: {...} }, ... ]
 }
*/
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");
    const slug = searchParams.get("slug");

    if (!siteId || !slug) {
      return NextResponse.json(
        { error: "siteId & slug required" },
        { status: 400 },
      );
    }

    const page = await prisma.page.findUnique({
      where: { siteId_slug: { siteId, slug } },
      select: {
        id: true,
        siteId: true,
        title: true,
        slug: true,
        status: true,
        seoTitle: true,
        seoDescription: true,
        jsonLd: true, // <-- add this
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // If not published and not in preview mode, optionally block (here we allow)
    const sections = await prisma.section.findMany({
      where: { pageId: page.id },
      orderBy: { order: "asc" },
    });

    // Resolve referenced media ids -> URLs in content
    const mediaIds = new Set();
    sections.forEach((s) => {
      const c = s.content || {};
      if (c.bannerMediaId) mediaIds.add(c.bannerMediaId);
      if (c.imageMediaId) mediaIds.add(c.imageMediaId);
    });

    let mediaMap = {};
    if (mediaIds.size > 0) {
      const mediaRows = await prisma.media.findMany({
        where: { id: { in: Array.from(mediaIds) } },
        select: { id: true, secureUrl: true, url: true, altText: true },
      });
      mediaMap = mediaRows.reduce((acc, m) => {
        acc[m.id] = m.secureUrl || m.url || null;
        return acc;
      }, {});
    }

    const sectionsWithUrls = sections.map((s) => {
      const content = { ...(s.content || {}) };
      if (content.bannerMediaId && mediaMap[content.bannerMediaId]) {
        content.bannerUrl = mediaMap[content.bannerMediaId];
      }
      if (content.imageMediaId && mediaMap[content.imageMediaId]) {
        content.imageUrl = mediaMap[content.imageMediaId];
      }
      return { ...s, content };
    });

    const seo = {
      title: page.seoTitle || page.title,
      description: page.seoDescription || null,
      canonical: null,
      ogImage: null,
    };

    return NextResponse.json({
      page,
      sections: sectionsWithUrls,
      seo,
      jsonLd: page.jsonLd ?? null,
    });
  } catch (err) {
    console.error("GET /api/content error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: String(err?.message) },
      { status: 500 },
    );
  }
}
