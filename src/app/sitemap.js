import prisma from "@/lib/prisma";
import { seoService } from "@/services/seo.service";

export default async function sitemap() {
  try {
    // 1. Fetch default active site
    const site = await prisma.site.findFirst({
      where: { isActive: true, deletedAt: null },
    });
    if (!site) return [];

    // 2. Query published items from the SEO service
    const items = await seoService.getSitemapItems(site.id);

    // 3. Resolve canonical domain settings
    const settings = await prisma.globalSettings.findUnique({
      where: { siteId: site.id },
      select: { websiteSettings: true },
    });

    const domain = settings?.websiteSettings?.domain || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const cleanDomain = domain.endsWith("/") ? domain.slice(0, -1) : domain;

    // 4. Map to standard Next.js sitemap format
    return items.map((item) => {
      const path = item.url.startsWith("/") ? item.url : `/${item.url}`;
      return {
        url: `${cleanDomain}${path}`,
        lastModified: new Date(item.lastModified),
        changeFrequency: "daily",
        priority: path === "/" ? 1.0 : 0.8,
      };
    });
  } catch (err) {
    console.error("Sitemap generation error:", err);
    return [];
  }
}
