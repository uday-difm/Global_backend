import prisma from "@/lib/prisma";
import { emailService } from "./email.service";
import { BaseService } from "@/core/service";

export class NotificationService extends BaseService {
  constructor() {
    super({ modelName: "globalSettings" });
  }

  async getNotificationConfig(siteId) {
    const settings = await prisma.globalSettings.findUnique({
      where: { siteId },
      select: { notifications: true }
    });
    return settings?.notifications || {
      newLead: { email: true, dashboard: true },
      failedForm: { email: true, dashboard: true },
      blogAlert: { email: true, dashboard: true }
    };
  }

  async updateNotificationConfig(siteId, config) {
    return prisma.globalSettings.upsert({
      where: { siteId },
      update: { notifications: config },
      create: { siteId, notifications: config }
    });
  }

  async notifyNewLead(siteId, lead) {
    const config = await this.getNotificationConfig(siteId);
    if (config.newLead?.email) {
      const settings = await prisma.globalSettings.findUnique({
        where: { siteId },
        select: { emailSettings: true }
      });
      const adminEmail = settings?.emailSettings?.adminAlerts?.email || settings?.emailSettings?.username;
      if (adminEmail) {
        const { transporter, fromEmail } = await emailService.getTransporterForSite(siteId);
        await transporter.sendMail({
          from: fromEmail,
          to: adminEmail,
          subject: `[Lead Alert] New Lead Captured: ${lead.name}`,
          text: `A new lead has been recorded on the system:\n\nName: ${lead.name}\nEmail: ${lead.email}\nPhone: ${lead.phone || "N/A"}\nInterest: ${lead.serviceInterest || "N/A"}\n\nView in Lead CRM dashboard.`
        });
      }
    }
  }

  async notifyFailedForm(siteId, errorDetails) {
    const config = await this.getNotificationConfig(siteId);
    if (config.failedForm?.email) {
      const settings = await prisma.globalSettings.findUnique({
        where: { siteId },
        select: { emailSettings: true }
      });
      const adminEmail = settings?.emailSettings?.adminAlerts?.email || settings?.emailSettings?.username;
      if (adminEmail) {
        const { transporter, fromEmail } = await emailService.getTransporterForSite(siteId);
        await transporter.sendMail({
          from: fromEmail,
          to: adminEmail,
          subject: `[System Alert] Contact Form Submission Failure`,
          text: `A contact form submission failed on your site.\n\nError: ${errorDetails.message}\nPayload: ${JSON.stringify(errorDetails.payload)}\n\nPlease check system logs.`
        });
      }
    }
  }

  async notifyNewBlogPost(siteId, post) {
    const config = await this.getNotificationConfig(siteId);
    if (config.blogAlert?.email) {
      const settings = await prisma.globalSettings.findUnique({
        where: { siteId },
        select: { emailSettings: true }
      });
      const adminEmail = settings?.emailSettings?.adminAlerts?.email || settings?.emailSettings?.username;
      if (adminEmail) {
        const { transporter, fromEmail } = await emailService.getTransporterForSite(siteId);
        await transporter.sendMail({
          from: fromEmail,
          to: adminEmail,
          subject: `[Blog Alert] New Post Published: ${post.title}`,
          text: `A new blog post has been published:\n\nTitle: ${post.title}\nSlug: ${post.slug}\n\nCheck out the live post.`
        });
      }
    }
  }
}

export const notificationService = new NotificationService();
