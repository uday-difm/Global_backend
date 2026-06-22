import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

async function resolveAuth(apiKey, siteId) {
  if (apiKey) {
    const frontendProject = await prisma.frontendProject.findUnique({
      where: { apiKey },
    });

    if (frontendProject) {
      if (!frontendProject.isActive) {
        return { error: "Frontend project is inactive", status: 401 };
      }
      if (frontendProject.siteId !== siteId) {
        return {
          error: "Frontend project does not belong to this site",
          status: 401,
        };
      }
      return { frontendProject };
    }
  }

  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) {
    return { error: "Site not found", status: 404 };
  }

  if (site.integrationKey) {
    if (!apiKey || apiKey !== site.integrationKey) {
      return { error: "Invalid integration key", status: 401 };
    }
    return { site };
  }

  if (process.env.NODE_ENV === "production") {
    return { error: "Site integration not configured", status: 401 };
  }

  return { site };
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");

    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    const apiKey = req.headers.get("x-integration-key") || searchParams.get("integrationKey") || searchParams.get("integration_key");
    const auth = await resolveAuth(apiKey, siteId);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let project = auth.frontendProject;
    if (!project) {
      project = await prisma.frontendProject.findFirst({
        where: { siteId, isActive: true },
        orderBy: { createdAt: "asc" },
      });
    }

    if (!project) {
      return NextResponse.json({
        success: true,
        lastSyncAt: null,
        pageCount: 0,
        syncedRoutes: []
      });
    }

    const syncedRoutes = await prisma.syncedRoute.findMany({
      where: { frontendProjectId: project.id },
      include: {
        page: {
          select: {
            title: true,
            status: true
          }
        }
      },
      orderBy: { route: "asc" }
    });

    return NextResponse.json({
      success: true,
      lastSyncAt: project.lastSyncAt,
      lastManifestHash: project.lastManifestHash || null,
      pageCount: syncedRoutes.length,
      syncedRoutes: syncedRoutes.map(sr => ({
        route: sr.route,
        source: sr.source,
        discoveredAt: sr.discoveredAt,
        pageStatus: sr.page?.status || "UNKNOWN",
        pageTitle: sr.page?.title || "Untitled"
      }))
    });
  } catch (err) {
    console.error("GET /api/integrations/next-sync/status error:", err);
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}
