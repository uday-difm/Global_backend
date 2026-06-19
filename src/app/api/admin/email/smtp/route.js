import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkSitePermission } from "@/lib/apiAuth";

export async function GET(req) {
  const auth = await checkSitePermission(req, "ADMIN");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const settings = await prisma.globalSettings.findUnique({
      where: { siteId: auth.siteId },
      select: { emailSettings: true }
    });

    // Sanitized settings (do not return plain passwords)
    const emailSettings = settings?.emailSettings || {};
    const sanitized = {
      ...emailSettings,
      password: emailSettings.password ? "********" : null
    };

    return NextResponse.json({ success: true, emailSettings: sanitized });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  const auth = await checkSitePermission(req, "ADMIN");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { host, port, username, password, formEmail, autoReplyTemplate, adminAlerts } = body;

    const settings = await prisma.globalSettings.findUnique({
      where: { siteId: auth.siteId },
      select: { emailSettings: true }
    });

    const currentEmailSettings = settings?.emailSettings || {};
    const updatedEmailSettings = {
      host: host !== undefined ? host : currentEmailSettings.host,
      port: port !== undefined ? port : currentEmailSettings.port,
      username: username !== undefined ? username : currentEmailSettings.username,
      // If password is "********" or empty, retain current password
      password: (password !== undefined && password !== "********") ? password : currentEmailSettings.password,
      formEmail: formEmail !== undefined ? formEmail : currentEmailSettings.formEmail,
      autoReplyTemplate: autoReplyTemplate !== undefined ? autoReplyTemplate : currentEmailSettings.autoReplyTemplate,
      adminAlerts: adminAlerts !== undefined ? adminAlerts : currentEmailSettings.adminAlerts,
      failedLogs: currentEmailSettings.failedLogs || []
    };

    const updated = await prisma.globalSettings.upsert({
      where: { siteId: auth.siteId },
      update: { emailSettings: updatedEmailSettings },
      create: { siteId: auth.siteId, emailSettings: updatedEmailSettings }
    });

    const sanitized = {
      ...updated.emailSettings,
      password: updated.emailSettings.password ? "********" : null
    };

    return NextResponse.json({ success: true, emailSettings: sanitized });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}
