import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkSitePermission } from "@/lib/apiAuth";
import nodemailer from "nodemailer";

export async function POST(req) {
  const auth = await checkSitePermission(req, "ADMIN");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const settings = await prisma.globalSettings.findUnique({
    where: { siteId: auth.siteId },
    select: { emailSettings: true }
  });

  const emailSettings = settings?.emailSettings || {};
  const { host, port, username, password, formEmail } = emailSettings;

  if (!host || !port || !username || !password) {
    return NextResponse.json({ error: "SMTP is not fully configured" }, { status: 400 });
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port, 10),
      secure: parseInt(port, 10) === 465,
      auth: {
        user: username,
        pass: password
      },
      // Timeout settings to prevent hanging in test
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000
    });

    // Send test email
    await transporter.sendMail({
      from: formEmail || username,
      to: auth.user.email,
      subject: "SMTP Configuration Test - Global Backend CMS",
      text: "Congratulations! Your SMTP settings have been verified and are working correctly."
    });

    return NextResponse.json({ success: true, message: `Test email sent successfully to ${auth.user.email}` });
  } catch (err) {
    console.error("SMTP Test Error:", err);

    // Log failure
    try {
      const currentEmailSettings = settings.emailSettings || {};
      const failedLogs = currentEmailSettings.failedLogs || [];
      failedLogs.unshift({
        error: err.message,
        timestamp: new Date().toISOString()
      });

      // Keep only last 50 failed logs
      const updatedFailedLogs = failedLogs.slice(0, 50);

      await prisma.globalSettings.update({
        where: { siteId: auth.siteId },
        data: {
          emailSettings: {
            ...currentEmailSettings,
            failedLogs: updatedFailedLogs
          }
        }
      });
    } catch (dbErr) {
      console.error("Failed to save SMTP fail log to DB:", dbErr);
    }

    return NextResponse.json({
      success: false,
      error: "SMTP connection failed",
      message: err.message
    }, { status: 500 });
  }
}
