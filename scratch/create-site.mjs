import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Error: DATABASE_URL environment variable is missing.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function createSite(name, domain, customId = null) {
  try {
    const siteId = customId || `site_${crypto.randomBytes(8).toString("hex")}`;
    
    console.log(`Creating site: "${name}"...`);
    const site = await prisma.site.create({
      data: {
        id: siteId,
        name,
        domain: domain || null,
        isActive: true
      }
    });

    console.log("-----------------------------------------");
    console.log("✅ Site created successfully!");
    console.log("   Site ID:", site.id);
    console.log("   Site Name:", site.name);
    console.log("   Domain:", site.domain || "Not specified");
    console.log("-----------------------------------------");
    
    // Auto-create basic settings for the new site
    console.log("Initializing global settings for new site...");
    await prisma.globalSettings.create({
      data: {
        siteId: site.id,
        websiteSettings: { title: name, domain: domain || "" },
        header: { sticky: true, logoAlign: "left", logoHeight: 40 },
        footer: { copyright: `© ${new Date().getFullYear()} ${name}. All rights reserved.` },
        navigation: { links: [{ label: "Home", url: "/" }] }
      }
    });
    console.log("✅ Global settings initialized!");

    // Create default frontend project for sync
    console.log("Provisioning default Frontend Project API key...");
    const project = await prisma.frontendProject.create({
      data: {
        siteId: site.id,
        name: `${name} NextJS App`,
        framework: "next",
        apiKey: `key_${crypto.randomBytes(16).toString("hex")}`,
        syncStatus: "disconnected"
      }
    });
    console.log("✅ Default Frontend Project created!");
    console.log("   SDK API Key:", project.apiKey);

    // Auto-generate initial Integration Manifest & default draft pages
    console.log("Generating default pages and content sync manifest...");
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
      siteId: site.id,
      source: "provision-wizard",
      generatedAt: new Date().toISOString(),
      routes: defaultRoutes
    };

    await prisma.integrationManifest.create({
      data: {
        siteId: site.id,
        source: "provision-wizard",
        manifestHash,
        rawJson
      }
    });

    for (const r of defaultRoutes) {
      const page = await prisma.page.create({
        data: {
          siteId: site.id,
          title: r.title,
          slug: r.slug,
          status: "DRAFT",
          isDiscovered: true,
          isManagedBySync: true,
          sourceRoute: r.slug
        }
      });

      await prisma.syncedRoute.create({
        data: {
          frontendProjectId: project.id,
          route: r.slug,
          source: r.path,
          pageId: page.id
        }
      });
    }

    await prisma.frontendProject.update({
      where: { id: project.id },
      data: {
        lastSyncAt: new Date(),
        lastManifestHash: manifestHash,
        syncStatus: "connected"
      }
    });
    console.log("✅ Default pages and integration manifest created!");

    console.log("-----------------------------------------");
    console.log("Add these values to your Next.js app .env.local:");
    console.log(`NEXT_PUBLIC_SITE_ID=${site.id}`);
    console.log(`CMS_INTEGRATION_KEY=${project.apiKey}`);
    console.log("-----------------------------------------");

  } catch (err) {
    console.error("❌ Site creation failed:", err.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

// Read args
const args = process.argv.slice(2);
if (args.length < 1) {
  console.log("Usage: node scratch/create-site.mjs <SiteName> [domain] [customId]");
  process.exit(0);
}

const [name, domain, customId] = args;
createSite(name, domain, customId);
