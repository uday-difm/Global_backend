import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";
import { BaseService } from "@/core/service";

export class EmailService extends BaseService {
  constructor() {
    super({ modelName: "globalSettings" }); // uses globalSettings repo mappings
  }

  async getTransporterForSite(siteId) {
    const settings = await prisma.globalSettings.findUnique({
      where: { siteId },
      select: { emailSettings: true },
    });

    const emailConfig = settings?.emailSettings || {};
    const { host, port, username, password } = emailConfig;

    if (host && port && username && password) {
      return {
        transporter: nodemailer.createTransport({
          host,
          port: parseInt(port, 10),
          secure: parseInt(port, 10) === 465,
          auth: { user: username, pass: password },
          connectionTimeout: 10000,
        }),
        fromEmail: emailConfig.formEmail || username,
        config: emailConfig,
      };
    }

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const fallbackUser = process.env.SMTP_USER;
      return {
        transporter: nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || "587", 10),
          secure: (process.env.SMTP_PORT || "587") === "465",
          auth: { user: fallbackUser, pass: process.env.SMTP_PASS },
          connectionTimeout: 10000,
        }),
        fromEmail: process.env.FORM_EMAIL || fallbackUser,
        config: {
          adminAlerts: { enabled: true, email: fallbackUser },
          autoReplyTemplate: { enabled: true },
        },
      };
    }

    throw new Error(`Email SMTP is not configured for site: ${siteId} or global env.`);
  }

  async sendPasswordResetEmail(email, token) {
    const siteId = process.env.DEFAULT_SITE_ID || "site_01";
    const site = await prisma.site.findFirst({
      where: {
        OR: [
          { id: siteId },
          { isActive: true }
        ]
      }
    });

    const siteIdToUse = site ? site.id : siteId;
    const { transporter, fromEmail } = await this.getTransporterForSite(siteIdToUse);
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: fromEmail,
      to: email,
      subject: "Password Reset Request",
      text: `A password reset was requested. Use this link (expires in 1 hour): ${resetUrl}`,
      html: `<p>A password reset was requested. Click the link below to reset your password (expires in 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });
  }

  async sendContactFormAlerts(submission, lead, site) {
    const { transporter, fromEmail, config } = await this.getTransporterForSite(site.id);
    const { autoReplyTemplate, adminAlerts } = config;

    if (autoReplyTemplate?.enabled !== false) {
      const replySubject = (autoReplyTemplate?.subject || "Thanks for reaching out, {name}!")
        .replace("{name}", submission.name);
      const replyBody = (autoReplyTemplate?.body || "Hi {name},\n\nThank you for contacting us. We'll get back to you within 24 hours.\n\nBest regards,\n{siteName}")
        .replace("{name}", submission.name)
        .replace("{siteName}", site.name);

      try {
        await transporter.sendMail({
          from: fromEmail,
          to: submission.email,
          subject: replySubject,
          text: replyBody,
        });
      } catch (err) {
        console.error("Auto-reply email failed:", err);
      }
    }

    if (adminAlerts?.enabled !== false) {
      const adminEmail = adminAlerts?.email || fromEmail;
      try {
        await transporter.sendMail({
          from: fromEmail,
          to: adminEmail,
          subject: `[${site.name}] New Lead / Contact Submission: ${submission.name}`,
          text: `New contact form submission:\n\nName: ${submission.name}\nEmail: ${submission.email}\nPhone: ${submission.phone || "N/A"}\nMessage:\n${submission.message}\n\nView in CMS dashboard under Leads.`,
        });
      } catch (err) {
        console.error("Admin notification email failed:", err);
        await this.logEmailFailure(site.id, err.message, { context: "admin-alert", to: adminEmail });
      }
    }
  }

  async logEmailFailure(siteId, errorMessage, context = {}) {
    try {
      const settings = await prisma.globalSettings.findUnique({
        where: { siteId },
        select: { emailSettings: true },
      });

      const emailConfig = settings?.emailSettings || {};
      const failedLogs = emailConfig.failedLogs || [];

      failedLogs.unshift({
        error: errorMessage,
        timestamp: new Date().toISOString(),
        ...context,
      });

      await prisma.globalSettings.update({
        where: { siteId },
        data: {
          emailSettings: {
            ...emailConfig,
            failedLogs: failedLogs.slice(0, 50),
          },
        },
      });
    } catch (e) {
      console.error("Failed to write failed email log to DB:", e);
    }
  }
}

export const emailService = new EmailService();
