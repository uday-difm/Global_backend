import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const FormSubmitSchema = z.object({
  siteId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().min(1),
});

export async function POST(req) {
  try {
    const body = await req.json();
    const parsed = FormSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Validation failed", details: parsed.error.errors }, { status: 400 });
    }

    const { siteId, name, email, phone, message } = parsed.data;

    // Check if site exists
    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) {
      return NextResponse.json({ success: false, error: "Site not found" }, { status: 404 });
    }

    // Check spam config in securityControls
    const settings = await prisma.globalSettings.findUnique({
      where: { siteId },
      select: { securityControls: true }
    });

    const secControls = settings?.securityControls || {};
    // Simple mock spam check: if keyword 'spam' is in the message and spam block is enabled
    if (secControls.spamFilterEnabled && message.toLowerCase().includes("spam")) {
      return NextResponse.json({ success: false, error: "Submission blocked as spam" }, { status: 400 });
    }

    // Save Submission
    const submission = await prisma.contactFormSubmission.create({
      data: {
        siteId,
        name,
        email,
        phone,
        message,
        status: "new"
      }
    });

    // Save Lead
    const lead = await prisma.lead.create({
      data: {
        siteId,
        name,
        email,
        phone,
        serviceInterest: "Contact Form Submission",
        sourcePage: "Contact Page",
        status: "new",
        notes: `Form Message: ${message}`
      }
    });

    // Mock Send Email Notification (auto-reply / admin alerts)
    // If SMTP and notifications are configured, we would send emails here.
    console.log(`[Form Submit Alert] New submission from ${email} on Site ${siteId}`);

    return NextResponse.json({
      success: true,
      message: "Form submitted successfully",
      submissionId: submission.id,
      leadId: lead.id
    });
  } catch (err) {
    console.error("POST /api/forms/submit error:", err);
    return NextResponse.json({ success: false, error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}
