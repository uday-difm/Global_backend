import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSiteId } from "@/lib/siteGuard";
import { handleApiError } from "@/core/errors";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const siteId = getSiteId(req);
    const services = await prisma.service.findMany({
      where: { 
        siteId, 
        status: "ACTIVE", 
        deletedAt: null 
      },
      orderBy: { sortOrder: "asc" },
      include: { featuredImage: true },
    });
    return NextResponse.json({ success: true, services });
  } catch (err) {
    return handleApiError(err);
  }
}
