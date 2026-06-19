import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req, context) {
  try {
    const params = await context.params;
    const pageSlug = params?.pageSlug;
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");

    if (!siteId || !pageSlug) {
      return NextResponse.json({ error: "siteId and pageSlug are required" }, { status: 400 });
    }

    const decodedSlug = decodeURIComponent(pageSlug);
    // Standardize slug format (prefixed with /)
    const formattedSlug = decodedSlug.startsWith("/") ? decodedSlug : `/${decodedSlug}`;

    // 1. Try to find a Page
    const page = await prisma.page.findUnique({
      where: { siteId_slug: { siteId, slug: formattedSlug } },
      select: { title: true, seoTitle: true, seoDescription: true, jsonLd: true }
    });

    if (page) {
      return NextResponse.json({
        success: true,
        type: "page",
        seo: {
          title: page.seoTitle || page.title,
          description: page.seoDescription || null,
          canonical: `${process.env.NEXT_PUBLIC_APP_URL || ""}${formattedSlug}`,
          jsonLd: page.jsonLd
        }
      });
    }

    // 2. Try to find a blog Post (without leading / for blog slugs in some databases, so let's check both formats)
    const postSlug = formattedSlug.startsWith("/") ? formattedSlug.substring(1) : formattedSlug;
    const post = await prisma.post.findFirst({
      where: {
        siteId,
        OR: [
          { slug: postSlug },
          { slug: formattedSlug }
        ]
      },
      select: { title: true, seoTitle: true, seoDescription: true, excerpt: true }
    });

    if (post) {
      return NextResponse.json({
        success: true,
        type: "post",
        seo: {
          title: post.seoTitle || post.title,
          description: post.seoDescription || post.excerpt || null,
          canonical: `${process.env.NEXT_PUBLIC_APP_URL || ""}/blog/${postSlug}`
        }
      });
    }

    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  } catch (err) {
    console.error("GET /api/seo/[pageSlug] error:", err);
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}
