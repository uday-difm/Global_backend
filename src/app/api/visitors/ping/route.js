import { NextResponse } from "next/server";
import { analyticsService } from "@/services/analytics.service";
import { handleApiError, apiSuccess } from "@/core/errors";

export async function POST(req) {
  try {
    const body = await req.json();
    const { siteId, visitorId, pageViewed, location, deviceInfo, trafficSource, duration } = body;

    if (!siteId || !visitorId || !pageViewed) {
      return NextResponse.json({ error: "siteId, visitorId and pageViewed are required" }, { status: 400 });
    }

    const result = await analyticsService.recordPing(siteId, {
      visitorId,
      pageViewed,
      location,
      deviceInfo,
      trafficSource,
      duration: duration !== undefined ? Number(duration) : undefined,
    });

    return NextResponse.json(apiSuccess({ ...result }));
  } catch (err) {
    return handleApiError(err);
  }
}
