import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import crypto from "crypto";

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const siteId = "site_beta_test_456";

  console.log("Checking Beta Testing Website...");
  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) {
    console.log("Beta Testing Website not found. Skipping.");
    return;
  }

  // Find or create FrontendProject for Beta Testing Website
  let project = await prisma.frontendProject.findFirst({
    where: { siteId, isActive: true }
  });

  if (!project) {
    console.log("Creating default FrontendProject for Beta Testing Website...");
    project = await prisma.frontendProject.create({
      data: {
        siteId,
        name: "Beta Testing Website NextJS App",
        framework: "next",
        apiKey: `key_${crypto.randomBytes(16).toString("hex")}`,
        syncStatus: "disconnected"
      }
    });
  }

  // Define default routes
  const defaultRoutes = [
    { slug: "/", path: "app/page.jsx", type: "static", title: "Home" },
    { slug: "/about", path: "app/about/page.jsx", type: "static", title: "About" },
    { slug: "/services", path: "app/services/page.jsx", type: "static", title: "Services" },
    { slug: "/blog", path: "app/blog/page.jsx", type: "static", title: "Blog" },
    { slug: "/contact", path: "app/contact/page.jsx", type: "static", title: "Contact" }
  ];

  const manifestHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(defaultRoutes))
    .digest("hex");

  const rawJson = {
    siteId,
    source: "auto-provision",
    generatedAt: new Date().toISOString(),
    routes: defaultRoutes
  };

  // Find or create IntegrationManifest
  const existingManifest = await prisma.integrationManifest.findFirst({
    where: { siteId }
  });

  if (!existingManifest) {
    await prisma.integrationManifest.create({
      data: {
        siteId,
        source: "auto-provision",
        manifestHash,
        rawJson
      }
    });
    console.log("Created IntegrationManifest for Beta Testing Website.");
  }

  // Create default draft pages
  for (const r of defaultRoutes) {
    const existingPage = await prisma.page.findUnique({
      where: { siteId_slug: { siteId, slug: r.slug } }
    });

    let pageId;
    if (!existingPage) {
      const page = await prisma.page.create({
        data: {
          siteId,
          title: r.title,
          slug: r.slug,
          status: "DRAFT",
          isDiscovered: true,
          isManagedBySync: true,
          sourceRoute: r.slug
        }
      });
      pageId = page.id;
      console.log(`Created draft page ${r.slug}`);
    } else {
      pageId = existingPage.id;
    }

    const existingSyncedRoute = await prisma.syncedRoute.findUnique({
      where: {
        frontendProjectId_route: {
          frontendProjectId: project.id,
          route: r.slug
        }
      }
    });

    if (!existingSyncedRoute) {
      await prisma.syncedRoute.create({
        data: {
          frontendProjectId: project.id,
          route: r.slug,
          source: r.path,
          pageId
        }
      });
    }
  }

  await prisma.frontendProject.update({
    where: { id: project.id },
    data: {
      lastSyncAt: new Date(),
      lastManifestHash: manifestHash,
      syncStatus: "connected"
    }
  });

  console.log("✅ Beta Testing Website fully provisioned with manifest & pages!");
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
