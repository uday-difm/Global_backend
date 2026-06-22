import { NextResponse } from "next/server";
import { seoService } from "@/services/seo.service";
import { getSiteId } from "@/lib/siteGuard";
import { handleApiError } from "@/core/errors";
import { validateIntegrationKey } from "@/lib/apiAuth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const siteId = getSiteId(request);

    const auth = await validateIntegrationKey(request, siteId);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Fetch site domain
    const settings = await prisma.globalSettings.findUnique({
      where: { siteId },
      select: { websiteSettings: true }
    });
    const domain = settings?.websiteSettings?.domain || null;

    const items = await seoService.getSitemapItems(siteId, domain);
    return NextResponse.json(items);
  } catch (err) {
    return handleApiError(err);
  }
}

