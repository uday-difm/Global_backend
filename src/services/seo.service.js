import prisma from "@/lib/prisma";
import { BaseService } from "@/core/service";
import { NotFoundError } from "@/core/errors";

export class SeoService extends BaseService {
  constructor() {
    super({ modelName: "globalSettings" });
  }

  async getSitemapItems(siteId, domain = null) {
    const pages = await prisma.page.findMany({
      where: { siteId, status: "PUBLISHED", deletedAt: null },
      select: { slug: true, updatedAt: true, changeFreq: true, priority: true },
      orderBy: { updatedAt: "desc" },
    });

    const posts = await prisma.post.findMany({
      where: { siteId, status: "PUBLISHED", deletedAt: null },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });

    const legalPages = await prisma.legalPage.findMany({
      where: { siteId, deletedAt: null },
      select: { type: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });

    const cleanDomain = domain ? (domain.endsWith("/") ? domain.slice(0, -1) : domain) : "";

    const formatUrl = (path) => {
      const formattedPath = path.startsWith("/") ? path : `/${path}`;
      return cleanDomain ? `${cleanDomain}${formattedPath}` : formattedPath;
    };

    const items = [
      ...pages.map(p => ({
        url: formatUrl(p.slug),
        lastModified: p.updatedAt.toISOString(),
        changeFrequency: p.changeFreq || "monthly",
        priority: p.priority || 0.5,
      })),
      ...posts.map(p => ({
        url: formatUrl(`/blogs/${p.slug}`),
        lastModified: p.updatedAt.toISOString(),
        changeFrequency: "weekly",
        priority: 0.6,
      })),
      ...legalPages.map(lp => ({
        url: formatUrl(`/legal/${lp.type}`),
        lastModified: lp.updatedAt.toISOString(),
        changeFrequency: "monthly",
        priority: 0.3,
      })),
    ];

    return items;
  }


  async getRobotsTxt(siteId) {
    const settings = await prisma.globalSettings.findUnique({
      where: { siteId },
      select: { websiteSettings: true },
    });

    if (settings?.websiteSettings?.robotsTxt) {
      return settings.websiteSettings.robotsTxt;
    }
    
    const domain = settings?.websiteSettings?.domain || `http://localhost:3000`;
    
    return `User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/

Sitemap: ${domain}/sitemap.xml
`;
  }

  async getLlmTxt(siteId) {
    const settings = await prisma.globalSettings.findUnique({
      where: { siteId },
      select: { websiteSettings: true },
    });

    if (settings?.websiteSettings?.llmTxt) {
      return settings.websiteSettings.llmTxt;
    }

    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: {
        services: { where: { status: "ACTIVE" }, select: { title: true, description: true } },
        posts: { where: { status: "PUBLISHED" }, select: { title: true, excerpt: true } },
      }
    });

    if (!site) {
      throw new NotFoundError("Site");
    }

    let text = `# ${site.name} - AI Agent Guide\n\n`;
    text += `This document provides indexable information on the services, posts, and structure of ${site.name} for AI and LLM agents.\n\n`;
    
    text += `## Core Offerings & Services\n`;
    site.services.forEach(s => {
      text += `- **${s.title}**: ${s.description || "No description"}\n`;
    });
    text += `\n`;

    text += `## Latest Blog Posts\n`;
    site.posts.forEach(p => {
      text += `- **${p.title}**: ${p.excerpt || "Read full article"}\n`;
    });

    return text;
  }
}

export const seoService = new SeoService();
