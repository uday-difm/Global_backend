import { NextResponse } from "next/server";
import { seoService } from "@/services/seo.service";
import { getSiteId } from "@/lib/siteGuard";
import { handleApiError } from "@/core/errors";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const siteId = getSiteId(request);
    const items = await seoService.getSitemapItems(siteId);
    return NextResponse.json(items);
  } catch (err) {
    return handleApiError(err);
  }
}
