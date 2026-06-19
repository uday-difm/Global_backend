import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkSitePermission } from "@/lib/apiAuth";

export async function GET(req) {
  const auth = await checkSitePermission(req, "VIEWER");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    // Fetch active logs in the last 2 minutes
    const logs = await prisma.visitorLog.findMany({
      where: {
        siteId: auth.siteId,
        createdAt: { gte: twoMinutesAgo }
      },
      orderBy: { createdAt: "desc" }
    });

    // Count unique visitors
    const uniqueVisitors = new Set(logs.map(log => log.visitorId));
    
    // Group active pages
    const pageCounts = {};
    logs.forEach(log => {
      pageCounts[log.pageViewed] = (pageCounts[log.pageViewed] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      liveCount: uniqueVisitors.size,
      activePages: pageCounts,
      recentActivity: logs.slice(0, 10)
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}
