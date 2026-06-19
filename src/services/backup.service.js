import prisma from "@/lib/prisma";
import { BaseService } from "@/core/service";
import { ValidationError } from "@/core/errors";

export class BackupService extends BaseService {
  constructor() {
    super({ modelName: "globalSettings" });
  }

  async createBackup(siteId) {
    const pages = await prisma.page.findMany({ where: { siteId }, include: { sections: true } });
    const posts = await prisma.post.findMany({ where: { siteId }, include: { categories: true, tags: true } });
    const services = await prisma.service.findMany({ where: { siteId } });
    const testimonials = await prisma.testimonial.findMany({ where: { siteId } });
    const faqs = await prisma.faq.findMany({ where: { siteId } });
    const teamMembers = await prisma.teamMember.findMany({ where: { siteId } });
    const legalPages = await prisma.legalPage.findMany({ where: { siteId } });
    const redirects = await prisma.redirect.findMany({ where: { siteId } });
    const submissions = await prisma.contactFormSubmission.findMany({ where: { siteId } });
    const leads = await prisma.lead.findMany({ where: { siteId } });
    
    const categories = await prisma.category.findMany();
    const tags = await prisma.tag.findMany();

    const backupData = {
      version: "1.1",
      siteId,
      timestamp: new Date().toISOString(),
      data: {
        pages,
        posts,
        services,
        testimonials,
        faqs,
        teamMembers,
        legalPages,
        redirects,
        submissions,
        leads,
        categories,
        tags
      }
    };

    return backupData;
  }

  async restoreBackup(siteId, backup) {
    if (!backup || backup.siteId !== siteId || !backup.data) {
      throw new ValidationError("Invalid backup payload or siteId mismatch");
    }

    const {
      pages,
      posts,
      services,
      testimonials,
      faqs,
      teamMembers,
      legalPages,
      redirects,
      submissions,
      leads,
      categories,
      tags
    } = backup.data;

    await prisma.$transaction(async (tx) => {
      await tx.page.deleteMany({ where: { siteId } });
      await tx.post.deleteMany({ where: { siteId } });
      await tx.service.deleteMany({ where: { siteId } });
      await tx.testimonial.deleteMany({ where: { siteId } });
      await tx.faq.deleteMany({ where: { siteId } });
      await tx.teamMember.deleteMany({ where: { siteId } });
      await tx.legalPage.deleteMany({ where: { siteId } });
      await tx.redirect.deleteMany({ where: { siteId } });
      await tx.contactFormSubmission.deleteMany({ where: { siteId } });
      await tx.lead.deleteMany({ where: { siteId } });

      if (categories && Array.isArray(categories)) {
        for (const cat of categories) {
          await tx.category.upsert({
            where: { slug: cat.slug },
            update: {},
            create: { name: cat.name, slug: cat.slug }
          });
        }
      }

      if (tags && Array.isArray(tags)) {
        for (const tag of tags) {
          await tx.tag.upsert({
            where: { slug: tag.slug },
            update: {},
            create: { name: tag.name, slug: tag.slug }
          });
        }
      }

      if (pages && Array.isArray(pages)) {
        for (const p of pages) {
          const { sections, ...pageProps } = p;
          const newPage = await tx.page.create({ data: pageProps });
          if (sections && Array.isArray(sections)) {
            for (const sec of sections) {
              const { id, pageId, ...secProps } = sec;
              await tx.section.create({
                data: {
                  ...secProps,
                  pageId: newPage.id
                }
              });
            }
          }
        }
      }

      if (posts && Array.isArray(posts)) {
        for (const p of posts) {
          const { categories: postCats, tags: postTags, author, featuredImage, ...postProps } = p;
          const createdPost = await tx.post.create({ data: postProps });
          
          if (postCats && postCats.length > 0) {
            await tx.post.update({
              where: { id: createdPost.id },
              data: {
                categories: { connect: postCats.map(c => ({ slug: c.slug })) }
              }
            });
          }
          if (postTags && postTags.length > 0) {
            await tx.post.update({
              where: { id: createdPost.id },
              data: {
                tags: { connect: postTags.map(t => ({ slug: t.slug })) }
              }
            });
          }
        }
      }

      if (services && Array.isArray(services)) {
        for (const s of services) {
          const { featuredImage, ...serviceProps } = s;
          await tx.service.create({ data: serviceProps });
        }
      }

      if (testimonials && Array.isArray(testimonials)) {
        for (const t of testimonials) {
          await tx.testimonial.create({ data: t });
        }
      }

      if (faqs && Array.isArray(faqs)) {
        for (const f of faqs) {
          await tx.faq.create({ data: f });
        }
      }

      if (teamMembers && Array.isArray(teamMembers)) {
        for (const tm of teamMembers) {
          await tx.teamMember.create({ data: tm });
        }
      }

      if (legalPages && Array.isArray(legalPages)) {
        for (const lp of legalPages) {
          await tx.legalPage.create({ data: lp });
        }
      }

      if (redirects && Array.isArray(redirects)) {
        for (const r of redirects) {
          await tx.redirect.create({ data: r });
        }
      }

      if (submissions && Array.isArray(submissions)) {
        for (const sub of submissions) {
          await tx.contactFormSubmission.create({ data: sub });
        }
      }

      if (leads && Array.isArray(leads)) {
        for (const l of leads) {
          await tx.lead.create({ data: l });
        }
      }
    });

    return { success: true };
  }

  async createMediaBackup(siteId) {
    const media = await prisma.media.findMany({
      where: { siteId },
      orderBy: { createdAt: "desc" }
    });

    return {
      version: "1.1",
      siteId,
      timestamp: new Date().toISOString(),
      media
    };
  }

  async getBackupHistory(siteId) {
    const settings = await prisma.globalSettings.findUnique({
      where: { siteId },
      select: { devTools: true }
    });

    const devTools = settings?.devTools || {};
    return devTools.backupHistory || [];
  }

  async logBackupHistory(siteId, type, size) {
    const settings = await prisma.globalSettings.findUnique({
      where: { siteId },
      select: { devTools: true }
    });

    const devTools = settings?.devTools || {};
    const backupHistory = devTools.backupHistory || [];
    
    const backupId = type === "media" ? `bkup_media_${Date.now()}` : `bkup_${Date.now()}`;
    backupHistory.unshift({
      id: backupId,
      type,
      timestamp: new Date().toISOString(),
      size
    });

    await prisma.globalSettings.update({
      where: { siteId },
      data: {
        devTools: {
          ...devTools,
          backupHistory
        }
      }
    });

    return backupId;
  }
}

export const backupService = new BackupService();
