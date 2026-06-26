import { NextResponse } from "next/server";
import { seoService } from "@/services/seo.service";
import { getSiteId } from "@/lib/siteGuard";
import { handleApiError } from "@/core/errors";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const siteId = getSiteId(request);
    const items = await seoService.getSitemapItems(siteId);

    // Build valid XML sitemap
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain") || `http://localhost:3000`;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    for (const item of items) {
      const url = `${domain}${item.url}`;
      const lastmod = item.lastModified || new Date().toISOString();
      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(url)}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (err) {
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      {
        headers: { "Content-Type": "application/xml; charset=utf-8" },
        status: 500,
      },
    );
  }
}

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
