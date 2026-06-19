import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkSitePermission } from "@/lib/apiAuth";

export async function POST(req) {
  const auth = await checkSitePermission(req, "ADMIN");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const siteId = auth.siteId;

    // Retrieve all site-specific data
    const pages = await prisma.page.findMany({ where: { siteId }, include: { sections: true } });
    const posts = await prisma.post.findMany({ where: { siteId } });
    const services = await prisma.service.findMany({ where: { siteId } });
    const testimonials = await prisma.testimonial.findMany({ where: { siteId } });
    const faqs = await prisma.faq.findMany({ where: { siteId } });
    const teamMembers = await prisma.teamMember.findMany({ where: { siteId } });
    const legalPages = await prisma.legalPage.findMany({ where: { siteId } });
    const redirects = await prisma.redirect.findMany({ where: { siteId } });
    const submissions = await prisma.contactFormSubmission.findMany({ where: { siteId } });
    const leads = await prisma.lead.findMany({ where: { siteId } });

    const backupData = {
      version: "1.0",
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
        leads
      }
    };

    // Log this backup in GlobalSettings.devTools.backupHistory
    const settings = await prisma.globalSettings.findUnique({
      where: { siteId },
      select: { devTools: true }
    });

    const devTools = settings?.devTools || {};
    const backupHistory = devTools.backupHistory || [];
    
    const backupId = `bkup_${Date.now()}`;
    backupHistory.unshift({
      id: backupId,
      type: "database",
      timestamp: new Date().toISOString(),
      size: JSON.stringify(backupData).length
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

    return NextResponse.json({
      success: true,
      backupId,
      message: "Database backup completed successfully",
      backup: backupData
    });
  } catch (err) {
    console.error("Database backup error:", err);
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}
