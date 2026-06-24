import { NextResponse } from "next/server";
import { pageService } from "@/services/page.service";
import prisma from "@/lib/prisma";
import { handleApiError } from "@/core/errors";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");
    const slug = searchParams.get("slug");

    if (!siteId || slug === null) {
      return NextResponse.json(
        { error: "siteId & slug required" },
        { status: 400 },
      );
    }

    const page = await pageService.getPageWithSections(siteId, slug);

    // Resolve referenced media ids -> URLs in content
    const mediaIds = new Set();
    page.sections.forEach((s) => {
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

    const sectionsWithUrls = await Promise.all(
      page.sections.map(async (s) => {
        const content = { ...(s.content || {}) };
        if (content.bannerMediaId && mediaMap[content.bannerMediaId]) {
          content.bannerUrl = mediaMap[content.bannerMediaId];
        }
        if (content.imageMediaId && mediaMap[content.imageMediaId]) {
          content.imageUrl = mediaMap[content.imageMediaId];
        }

        // Dynamically fetch items for component-specific lists
        const type = String(s.type || "").toUpperCase();
        if (type === "SERVICES") {
          content.items = await prisma.service.findMany({
            where: { siteId, status: "ACTIVE", deletedAt: null },
            orderBy: { sortOrder: "asc" },
          });
        } else if (type === "TEAM") {
          content.items = await prisma.teamMember.findMany({
            where: { siteId, deletedAt: null },
            orderBy: { sortOrder: "asc" },
          });
        } else if (type === "TESTIMONIALS") {
          content.items = await prisma.testimonial.findMany({
            where: { siteId, showHide: true, deletedAt: null },
            orderBy: { sortOrder: "asc" },
          });
        } else if (type === "FAQ") {
          content.items = await prisma.faq.findMany({
            where: {
              siteId,
              showHide: true,
              deletedAt: null,
              OR: [{ pageId: null }, { pageId: page.id }],
            },
            orderBy: { sortOrder: "asc" },
          });
        }

        return { ...s, content };
      })
    );

    const seo = {
      title: page.seoTitle || page.title,
      description: page.seoDescription || null,
      canonical: page.canonicalUrl || null,
      ogImage: page.ogImage || null,
    };

    const { sections, ...pageData } = page;

    return NextResponse.json({
      page: pageData,
      sections: sectionsWithUrls,
      seo,
      jsonLd: page.jsonLd ?? null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
