import prisma from "@/lib/prisma";
import { BaseService } from "@/core/service";
import { NotFoundError } from "@/core/errors";

export class SeoService extends BaseService {
  constructor() {
    super({ modelName: "globalSettings" });
  }

  async getSitemapItems(siteId) {
    const pages = await prisma.page.findMany({
      where: { siteId, status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });

    const posts = await prisma.post.findMany({
      where: { siteId, status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });

    const items = [
      ...pages.map(p => ({
        url: p.slug.startsWith("/") ? p.slug : `/${p.slug}`,
        lastModified: p.updatedAt.toISOString(),
      })),
      ...posts.map(p => ({
        url: `/blogs/${p.slug}`,
        lastModified: p.updatedAt.toISOString(),
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
