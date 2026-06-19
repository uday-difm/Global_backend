import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    const { siteId, visitorId, consentType, accepted } = body;

    if (!siteId || !visitorId || !consentType) {
      return NextResponse.json({ error: "siteId, visitorId, and consentType are required" }, { status: 400 });
    }

    const settings = await prisma.globalSettings.findUnique({
      where: { siteId },
      select: { compliance: true }
    });

    const compliance = settings?.compliance || {};
    const consentLogs = compliance.consentLogs || [];

    consentLogs.unshift({
      visitorId,
      consentType,
      accepted: !!accepted,
      timestamp: new Date().toISOString()
    });

    // Keep only last 100 logs in configuration
    const updatedLogs = consentLogs.slice(0, 100);

    await prisma.globalSettings.update({
      where: { siteId },
      data: {
        compliance: {
          ...compliance,
          consentLogs: updatedLogs
        }
      }
    });

    return NextResponse.json({ success: true, message: "Consent recorded successfully" });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}
