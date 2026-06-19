import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    const { siteId, visitorId, pageViewed, location, deviceInfo, trafficSource } = body;

    if (!siteId || !visitorId || !pageViewed) {
      return NextResponse.json({ error: "siteId, visitorId and pageViewed are required" }, { status: 400 });
    }

    // Standardize pageViewed prefix
    const page = pageViewed.startsWith("/") ? pageViewed : `/${pageViewed}`;

    // Find if there is an active log for this visitor & page in the last 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const existingLog = await prisma.visitorLog.findFirst({
      where: {
        siteId,
        visitorId,
        pageViewed: page,
        createdAt: { gte: twoMinutesAgo }
      },
      orderBy: { createdAt: "desc" }
    });

    if (existingLog) {
      // Calculate diff and update duration
      const diffSeconds = Math.round((Date.now() - new Date(existingLog.createdAt).getTime()) / 1000);
      await prisma.visitorLog.update({
        where: { id: existingLog.id },
        data: { duration: diffSeconds }
      });

      return NextResponse.json({ success: true, logId: existingLog.id, updated: true });
    } else {
      // Create new visitor log
      const newLog = await prisma.visitorLog.create({
        data: {
          siteId,
          visitorId,
          pageViewed: page,
          location: location || "Unknown",
          deviceInfo: deviceInfo || "Unknown",
          trafficSource: trafficSource || "Direct",
          duration: 0
        }
      });

      return NextResponse.json({ success: true, logId: newLog.id, created: true });
    }
  } catch (err) {
    console.error("POST /api/visitors/ping error:", err);
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}
