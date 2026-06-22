// global_backend/src/app/api/integrations/next-sync/manifest/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

/*
  POST /api/integrations/next-sync/manifest
  Headers:
    x-integration-key: <FrontendProject.apiKey or Site.integrationKey>

  Body:
    {
      siteId: string,
      source?: string,
      generatedAt?: string,
      routes: [
        { slug: string, path: string, type?: 'static'|'dynamic', title?: string }
      ]
    }
*/

const ManifestSchema = z.object({
  siteId: z.string().min(1),
  source: z.string().optional(),
  generatedAt: z.string().optional(),
  routes: z.array(
    z.object({
      slug: z.string().min(1),
      path: z.string().min(1),
      type: z.enum(["static", "dynamic"]).optional().default("static"),
      title: z.string().optional(),
    }),
  ),
});

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

export async function POST(req) {
  try {
    const apiKey = req.headers.get("x-integration-key");
    const body = await req.json();
    const parsed = ManifestSchema.parse(body);

    const auth = await resolveAuth(apiKey, parsed.siteId);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const crypto = await import("crypto");
    const manifestHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(parsed.routes))
      .digest("hex");

    // Determine frontendProjectId — must exist for SyncedRoute
    let frontendProjectId = auth.frontendProject?.id || null;

    // If auth is via site integrationKey, get or create a default FrontendProject
    if (!frontendProjectId && auth.site) {
      const defaultProject = await prisma.frontendProject.findFirst({
        where: { siteId: parsed.siteId, isActive: true },
        orderBy: { createdAt: "asc" },
      });
      if (defaultProject) {
        frontendProjectId = defaultProject.id;
      } else {
        // Create an auto-detected project entry
        const newProject = await prisma.frontendProject.create({
          data: {
            siteId: parsed.siteId,
            name: "Auto-detected (legacy)",
            framework: "next",
            apiKey: `auto_${crypto.randomBytes(16).toString("hex")}`,
            baseUrl: null,
            syncStatus: "connected",
          },
        });
        frontendProjectId = newProject.id;
      }
    }

    if (!frontendProjectId) {
      return NextResponse.json(
        { error: "No frontend project found. Create one first." },
        { status: 400 },
      );
    }

    await prisma.integrationManifest.create({
      data: {
        siteId: parsed.siteId,
        source: parsed.source ?? "unknown",
        manifestHash,
        rawJson: parsed,
      },
    });

    const created = [];
    const updated = [];
    const syncedRoutes = [];

    for (const r of parsed.routes) {
      const slug = r.slug.startsWith("/") ? r.slug : `/${r.slug}`;

      const existing = await prisma.page.findUnique({
        where: { siteId_slug: { siteId: parsed.siteId, slug } },
      });

      let pageId = existing?.id ?? null;

      if (!existing) {
        const newPage = await prisma.page.create({
          data: {
            siteId: parsed.siteId,
            title: r.title ?? slug,
            slug,
            status: "DRAFT",
            isDiscovered: true,
            isManagedBySync: true,
            sourceRoute: slug,
          },
        });
        pageId = newPage.id;
        created.push({ slug, pageId: newPage.id });
      } else {
        await prisma.page.update({
          where: { id: existing.id },
          data: {
            title: r.title ?? existing.title,
            isDiscovered: true,
            sourceRoute: existing.sourceRoute || slug,
          },
        });
        updated.push({ slug, pageId: existing.id });
      }

      // Upsert syncedRoute with frontendProjectId instead of siteId
      const syncedRoute = await prisma.syncedRoute.upsert({
        where: {
          frontendProjectId_route: {
            frontendProjectId,
            route: slug,
          },
        },
        create: {
          frontendProjectId,
          route: slug,
          source: r.path ?? parsed.source ?? null,
          pageId,
        },
        update: {
          source: r.path ?? parsed.source ?? null,
          pageId,
          discoveredAt: new Date(),
        },
      });

      syncedRoutes.push({
        route: syncedRoute.route,
        pageId: syncedRoute.pageId,
        source: syncedRoute.source,
      });
    }

    if (auth.frontendProject) {
      await prisma.frontendProject.update({
        where: { id: auth.frontendProject.id },
        data: {
          lastSyncAt: new Date(),
          lastManifestHash: manifestHash,
          syncStatus: "connected",
        },
      });
    } else if (frontendProjectId) {
      await prisma.frontendProject.update({
        where: { id: frontendProjectId },
        data: {
          lastSyncAt: new Date(),
          lastManifestHash: manifestHash,
          syncStatus: "connected",
        },
      });
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
      syncedRoutes,
      manifestHash,
      frontendProjectId,
    });
  } catch (err) {
    console.error("Manifest POST error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.errors },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error", message: String(err?.message || err) },
      { status: 500 },
    );
  }
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

    const lastManifest = await prisma.integrationManifest.findFirst({
      where: { siteId },
      orderBy: { createdAt: "desc" },
    });

    if (!lastManifest) {
      return NextResponse.json({
        success: true,
        lastSync: null,
        manifestHash: null,
        pageCount: 0,
        source: null,
      });
    }

    const rawJson = lastManifest.rawJson || {};
    const routesCount = Array.isArray(rawJson.routes) ? rawJson.routes.length : 0;

    return NextResponse.json({
      success: true,
      lastSync: lastManifest.createdAt,
      manifestHash: lastManifest.manifestHash,
      pageCount: routesCount,
      source: lastManifest.source,
    });
  } catch (err) {
    console.error("GET next-sync/manifest error:", err);
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}

