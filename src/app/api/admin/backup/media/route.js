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

    // Retrieve media details
    const media = await prisma.media.findMany({
      orderBy: { createdAt: "desc" }
    });

    const backupData = {
      version: "1.0",
      siteId,
      timestamp: new Date().toISOString(),
      media
    };

    // Log in backupHistory
    const settings = await prisma.globalSettings.findUnique({
      where: { siteId },
      select: { devTools: true }
    });

    const devTools = settings?.devTools || {};
    const backupHistory = devTools.backupHistory || [];
    
    const backupId = `bkup_media_${Date.now()}`;
    backupHistory.unshift({
      id: backupId,
      type: "media",
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
      message: "Media backup completed successfully",
      backup: backupData
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}
