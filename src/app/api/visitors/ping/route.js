import { NextResponse } from "next/server";
import { analyticsService } from "@/services/analytics.service";
import { handleApiError } from "@/core/errors";

export async function POST(req) {
  try {
    const body = await req.json();
    const { siteId, visitorId, pageViewed, location, deviceInfo, trafficSource } = body;

    if (!siteId || !visitorId || !pageViewed) {
      return NextResponse.json({ error: "siteId, visitorId and pageViewed are required" }, { status: 400 });
    }

    const result = await analyticsService.recordPing(siteId, {
      visitorId,
      pageViewed,
      location,
      deviceInfo,
      trafficSource,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return handleApiError(err);
  }
}
