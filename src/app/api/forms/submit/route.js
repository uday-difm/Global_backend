import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkSitePermission } from "@/lib/apiAuth";
import nodemailer from "nodemailer";
import { z } from "zod";

const FormSubmitSchema = z.object({
  siteId: z.string().min(1),
  name: z.string().min(1, "Name is required"),
  email: z.email("Valid email is required"),
  phone: z.string().optional(),
  message: z.string().min(1, "Message is required"),
  // Honeypot field — must be empty
  _hp: z.string().optional(),
});

export async function POST(req) {
  try {
    const body = await req.json();
    const parsed = FormSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.errors,
        },
        { status: 400 },
      );
    }

    const { siteId, name, email, phone, message, _hp } = parsed.data;

    // ── Honeypot check ─────────────────────────────────────────────────────────
    // Bots fill in all fields; real users leave honeypot blank
    if (_hp && _hp.trim().length > 0) {
      // Silently accept but do not persist (anti-bot)
      return NextResponse.json({
        success: true,
        message: "Form submitted successfully",
      });
    }

    // Check if site exists
    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) {
      return NextResponse.json(
        { success: false, error: "Site not found" },
        { status: 404 },
      );
    }

    // ── Load settings ──────────────────────────────────────────────────────────
    const settings = await prisma.globalSettings.findUnique({
      where: { siteId },
      select: { securityControls: true, emailSettings: true },
    });

    const secControls = settings?.securityControls || {};
    const emailSettings = settings?.emailSettings || {};

    // ── Spam keyword filter ────────────────────────────────────────────────────
    if (secControls.spamFilterEnabled) {
      const blockedKeywords = secControls.spamKeywords || [
        "spam",
        "casino",
        "viagra",
        "crypto",
      ];
      const combined = `${name} ${email} ${message}`.toLowerCase();
      const isSpam = blockedKeywords.some((kw) =>
        combined.includes(kw.toLowerCase()),
      );
      if (isSpam) {
        return NextResponse.json(
          { success: false, error: "Submission blocked as spam" },
          { status: 400 },
        );
      }
    }

    // ── Rate limiting: max 5 submissions from same email per hour ──────────────
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await prisma.contactFormSubmission.count({
      where: { siteId, email, createdAt: { gte: oneHourAgo } },
    });
    if (recentCount >= 5) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many submissions. Please try again later.",
        },
        { status: 429 },
      );
    }

    // ── Save Submission ────────────────────────────────────────────────────────
    const submission = await prisma.contactFormSubmission.create({
      data: { siteId, name, email, phone, message, status: "new" },
    });

    // ── Save Lead ──────────────────────────────────────────────────────────────
    const lead = await prisma.lead.create({
      data: {
        siteId,
        name,
        email,
        phone,
        serviceInterest: "Contact Form Submission",
        sourcePage: "Contact Page",
        status: "new",
        notes: `Form Message: ${message}`,
      },
    });

    // ── Send emails via SMTP ───────────────────────────────────────────────────
    const {
      host,
      port,
      username,
      password,
      formEmail,
      autoReplyTemplate,
      adminAlerts,
    } = emailSettings;

    if (host && port && username && password) {
      try {
        const transporter = nodemailer.createTransport({
          host,
          port: parseInt(port, 10),
          secure: parseInt(port, 10) === 465,
          auth: { user: username, pass: password },
          connectionTimeout: 10000,
        });

        // 1. Auto-reply to the user
        if (autoReplyTemplate?.enabled !== false) {
          const replySubject =
            autoReplyTemplate?.subject || `Thanks for reaching out, ${name}!`;
          const replyBody =
            autoReplyTemplate?.body ||
            `Hi ${name},\n\nThank you for contacting us. We received your message and will get back to you within 24 hours.\n\nBest regards,\n${site.name}`;

          await transporter.sendMail({
            from: formEmail || username,
            to: email,
            subject: replySubject,
            text: replyBody,
          });
        }

        // 2. Admin notification
        const adminEmail = adminAlerts?.email || formEmail || username;
        if (adminAlerts?.enabled !== false) {
          await transporter.sendMail({
            from: formEmail || username,
            to: adminEmail,
            subject: `[${site.name}] New Contact Form Submission from ${name}`,
            text: `New contact form submission:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || "N/A"}\n\nMessage:\n${message}\n\nView in CMS: /leads`,
          });
        }
      } catch (emailErr) {
        // Log email failure but don't fail the submission
        console.error("[Form Submit] Email send failed:", emailErr.message);
        try {
          const currentEmailSettings = settings.emailSettings || {};
          const failedLogs = currentEmailSettings.failedLogs || [];
          failedLogs.unshift({
            error: emailErr.message,
            timestamp: new Date().toISOString(),
            context: "form-submit",
          });
          await prisma.globalSettings.update({
            where: { siteId },
            data: {
              emailSettings: {
                ...currentEmailSettings,
                failedLogs: failedLogs.slice(0, 50),
              },
            },
          });
        } catch {}
      }
    }

    return NextResponse.json({
      success: true,
      message: "Form submitted successfully",
      submissionId: submission.id,
      leadId: lead.id,
    });
  } catch (err) {
    console.error("POST /api/forms/submit error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error", message: err.message },
      { status: 500 },
    );
  }
}
