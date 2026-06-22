// global_backend/src/app/api/integrations/sync-routes/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

/*
  POST /api/integrations/sync-routes
  Headers:
    x-integration-key: <FrontendProject.apiKey or Site.integrationKey>

  Body:
    {
      siteId: string,
      framework?: string,
      source?: string,
      generatedAt?: string,
      routes: [
        { slug: string, path: string, type?: 'static'|'dynamic', title?: string }
      ]
    }
*/

const SyncRoutesSchema = z.object({
  siteId: z.string().min(1),
  framework: z.string().optional().default("other"),
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
    const parsed = SyncRoutesSchema.parse(body);

    const auth = await resolveAuth(apiKey, parsed.siteId);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const crypto = await import("crypto");
    const manifestHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(parsed.routes))
      .digest("hex");

    // Determine frontendProjectId
    let frontendProjectId = auth.frontendProject?.id || null;

    // If auth is via site integrationKey, find or create matching FrontendProject for this framework
    if (!frontendProjectId && auth.site) {
      const existingProject = await prisma.frontendProject.findFirst({
        where: { siteId: parsed.siteId, framework: parsed.framework, isActive: true },
        orderBy: { createdAt: "asc" },
      });
      if (existingProject) {
        frontendProjectId = existingProject.id;
      } else {
        // Create a new project workspace for this technology stack
        const newProject = await prisma.frontendProject.create({
          data: {
            siteId: parsed.siteId,
            name: `${parsed.framework.toUpperCase()} Integration`,
            framework: parsed.framework,
            apiKey: `sync_${crypto.randomBytes(16).toString("hex")}`,
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

    // Save Integration Manifest history
    await prisma.integrationManifest.create({
      data: {
        siteId: parsed.siteId,
        source: parsed.source ?? "sync-cli",
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

      // Upsert syncedRoute mapping link
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

    // Update Project Status
    await prisma.frontendProject.update({
      where: { id: frontendProjectId },
      data: {
        lastSyncAt: new Date(),
        lastManifestHash: manifestHash,
        syncStatus: "connected",
      },
    });

    return NextResponse.json({
      success: true,
      created,
      updated,
      syncedRoutes,
      manifestHash,
      frontendProjectId,
    });
  } catch (err) {
    console.error("Sync-Routes Manifest POST error:", err);
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
