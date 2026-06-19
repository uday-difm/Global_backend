import { NextResponse } from "next/server";
import { analyticsService } from "@/services/analytics.service";
import { checkSitePermission } from "@/lib/apiAuth";
import { handleApiError } from "@/core/errors";

export async function GET(req) {
  try {
    const auth = await checkSitePermission(req, "VIEWER");
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const liveCount = await analyticsService.getLiveVisitorsCount(auth.siteId);
    
    // Fetch logs to show recent page activity
    const logs = await analyticsService.getVisitorLogs(auth.siteId, { take: 50 });
    const pageCounts = {};
    logs.forEach(log => {
      pageCounts[log.pageViewed] = (pageCounts[log.pageViewed] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      liveCount,
      activePages: pageCounts,
      recentActivity: logs.slice(0, 10)
    });
  } catch (err) {
    return handleApiError(err);
  }
}
