// global_backend/src/app/api/integrations/next-sync/manifest/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

/*
  POST /api/integrations/next-sync/manifest
  Headers:
    x-integration-key: <site.integrationKey>

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

export async function POST(req) {
  try {
    // read request
    const apiKey = req.headers.get("x-integration-key");
    const body = await req.json();

    // validate manifest shape
    const parsed = ManifestSchema.parse(body);

    // validate site exists
    const site = await prisma.site.findUnique({ where: { id: parsed.siteId } });
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // if site.integrationKey set, validate header
    if (site.integrationKey) {
      if (!apiKey || apiKey !== site.integrationKey) {
        return NextResponse.json(
          { error: "Invalid integration key" },
          { status: 401 },
        );
      }
    } else {
      // in production require the key; allow in dev if you prefer
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Site integration not configured" },
          { status: 401 },
        );
      }
    }

    // compute a simple manifest hash for reference
    const crypto = await import("crypto");
    const manifestHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(parsed.routes))
      .digest("hex");
    console.log("Prisma keys:", Object.keys(prisma || {}));
    if (!prisma || typeof prisma.integrationManifest === "undefined") {
      console.error(
        "PRISMA MISSING integrationManifest!",
        prisma && Object.keys(prisma),
      );
      return NextResponse.json(
        { error: "Server misconfiguration: Prisma client missing model" },
        { status: 500 },
      );
    }
    // store the raw manifest for audit
    await prisma.integrationManifest.create({
      data: {
        siteId: parsed.siteId,
        source: parsed.source ?? "unknown",
        manifestHash,
        rawJson: parsed,
      },
    });

    // upsert pages for each route (siteId + slug is unique)
    const created = [];
    const updated = [];

    for (const r of parsed.routes) {
      const slug = r.slug.startsWith("/") ? r.slug : `/${r.slug}`;

      // try find existing by composite unique siteId+slug
      const existing = await prisma.page
        .findUnique({
          where: { siteId_slug: { siteId: parsed.siteId, slug } },
        })
        .catch(() => null);

      if (!existing) {
        const newPage = await prisma.page.create({
          data: {
            siteId: parsed.siteId,
            title: r.title ?? null,
            slug,
            status: "DRAFT",
          },
        });
        created.push({ slug, pageId: newPage.id });
      } else {
        // update title if provided, keep status (don't auto-publish)
        await prisma.page.update({
          where: { id: existing.id },
          data: { title: r.title ?? existing.title },
        });
        updated.push({ slug, pageId: existing.id });
      }
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
      manifestHash,
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

// curl -i -X POST "http://localhost:3000/api/integrations/next-sync/manifest" \
//   -H "Content-Type: application/json" \
//   -H "x-integration-key: c6637fed3e24621db2ac776cf982a2e8fb8ed4fe70ab61e0048bc9238e672716" \
//   -d '{
//     "siteId": "cmqho1vz20000ucuhlpd88k4x",
//     "source": "local-next",
//     "generatedAt": "2026-06-18T00:00:00.000Z",
//     "routes": [
//       { "slug": "/", "path": "app/page.tsx", "type": "static", "title": "Home" },
//       { "slug": "/about", "path": "app/about/page.tsx", "type": "static", "title": "About" }
//     ]
//   }'
