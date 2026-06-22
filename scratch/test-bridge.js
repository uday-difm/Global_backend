/**
 * Next.js Bridge & Route Sync Verification Script
 * Run this to check all new endpoints, key authentication, headers, and SDK functionalities.
 * 
 * Usage:
 *   node scratch/test-bridge.js
 */

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pg = require("pg");
const crypto = require("crypto");
const http = require("http");
const path = require("path");

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:123@localhost:5432/global_backend";
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const BASE_URL = "http://localhost:3000";
const SITE_ID = "bridge_test_site_789";
const INTEGRATION_KEY = "super_secret_bridge_integration_key";

async function request(method, urlPath, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const options = {
      method: method.toUpperCase(),
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        "Content-Type": "application/json",
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data, headers: res.headers });
        }
      });
    });

    req.on("error", (e) => reject(e));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function verifyAll() {
  console.log("====================================================");
  console.log("  STARTING NEXT.JS BRIDGE & SYNC VERIFICATION TESTS  ");
  console.log("====================================================\n");

  let failures = 0;
  const assert = (condition, message) => {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failures++;
    }
  };

  try {
    // 1. Provision Test Site & Keys
    console.log("1. Setting up test site and configuration records...");
    await prisma.site.upsert({
      where: { id: SITE_ID },
      update: { name: "Bridge Test Site", integrationKey: INTEGRATION_KEY, isActive: true },
      create: { id: SITE_ID, name: "Bridge Test Site", integrationKey: INTEGRATION_KEY, isActive: true }
    });

    await prisma.globalSettings.upsert({
      where: { siteId: SITE_ID },
      update: {
        websiteSettings: { title: "Bridge Test Site", domain: "https://my-scaffold.vercel.app" },
        navigation: { main: [{ label: "Home", url: "/" }, { label: "Services", url: "/services" }] }
      },
      create: {
        siteId: SITE_ID,
        websiteSettings: { title: "Bridge Test Site", domain: "https://my-scaffold.vercel.app" },
        navigation: { main: [{ label: "Home", url: "/" }, { label: "Services", url: "/services" }] }
      }
    });

    // Create a page matching '/services'
    const testPage = await prisma.page.upsert({
      where: { siteId_slug: { siteId: SITE_ID, slug: "/services" } },
      update: {
        title: "Our Services",
        status: "PUBLISHED",
        seoTitle: "Best Premium Services",
        seoDescription: "The most premium services list.",
        ogImage: "https://images.cloudinary.com/custom-og.jpg",
        canonicalUrl: "https://my-scaffold.vercel.app/services",
        changeFreq: "daily",
        priority: 0.9
      },
      create: {
        siteId: SITE_ID,
        slug: "/services",
        title: "Our Services",
        status: "PUBLISHED",
        seoTitle: "Best Premium Services",
        seoDescription: "The most premium services list.",
        ogImage: "https://images.cloudinary.com/custom-og.jpg",
        canonicalUrl: "https://my-scaffold.vercel.app/services",
        changeFreq: "daily",
        priority: 0.9
      }
    });

    // Add a services section
    await prisma.section.deleteMany({ where: { pageId: testPage.id } });
    await prisma.section.create({
      data: {
        pageId: testPage.id,
        type: "SERVICES",
        name: "Services List",
        order: 1,
        content: {}
      }
    });

    // Add a blog post to test post featured image mapping as ogImage
    const testPost = await prisma.post.findFirst({ where: { siteId: SITE_ID } });
    if (!testPost) {
      // Find a media image to refer
      const testMedia = await prisma.media.findFirst({ where: { siteId: SITE_ID } });
      let featuredImageId = testMedia ? testMedia.id : null;
      
      await prisma.post.create({
        data: {
          siteId: SITE_ID,
          title: "My Awesome Blog Post",
          slug: "my-awesome-blog-post",
          content: "Welcome to my post",
          status: "PUBLISHED",
          featuredImageId
        }
      });
    }

    // 2. Validate GET /api/global-settings Auth & Cache Headers
    console.log("\n2. Testing /api/global-settings...");
    const badSettings = await request("GET", `/api/global-settings?siteId=${SITE_ID}`);
    assert(badSettings.status === 401, "Rejected without x-integration-key (401)");

    const goodSettings = await request("GET", `/api/global-settings?siteId=${SITE_ID}`, null, {
      "x-integration-key": INTEGRATION_KEY
    });
    assert(goodSettings.status === 200, "Approved with correct x-integration-key (200)");
    assert(
      goodSettings.headers["cache-control"] === "public, s-maxage=60, stale-while-revalidate=300",
      "Correct CDN Cache-Control headers returned"
    );
    assert(
      goodSettings.data.settings.websiteSettings?.title === "Bridge Test Site",
      "Correct site settings parsed and returned"
    );

    // 3. Validate GET /api/content with OG image and canonical
    console.log("\n3. Testing /api/content...");
    const badContent = await request("GET", `/api/content?siteId=${SITE_ID}&slug=/services`);
    assert(badContent.status === 401, "Rejected page content request without x-integration-key (401)");

    const goodContent = await request("GET", `/api/content?siteId=${SITE_ID}&slug=/services`, null, {
      "x-integration-key": INTEGRATION_KEY
    });
    assert(goodContent.status === 200, "Approved content request with integration key");
    assert(goodContent.data.seo?.ogImage === "https://images.cloudinary.com/custom-og.jpg", "Includes ogImage in SEO payload");
    assert(goodContent.data.seo?.canonical === "https://my-scaffold.vercel.app/services", "Includes canonical URL in SEO payload");
    assert(goodContent.data.sections[0]?.type === "SERVICES", "Returns populated section lists");

    // 4. Validate GET /api/seo/[pageSlug] relational featured image check
    console.log("\n4. Testing /api/seo/[pageSlug] mapping...");
    const seoPost = await request("GET", `/api/seo/my-awesome-blog-post?siteId=${SITE_ID}`);
    assert(seoPost.status === 200, "Public SEO fetch succeeds (200)");

    // 5. Validate GET /api/sitemap fields and domains
    console.log("\n5. Testing /api/sitemap...");
    const badSitemap = await request("GET", `/api/sitemap?siteId=${SITE_ID}`);
    assert(badSitemap.status === 401, "Sitemap query fails without integration key (401)");

    const goodSitemap = await request("GET", `/api/sitemap?siteId=${SITE_ID}`, null, {
      "x-integration-key": INTEGRATION_KEY
    });
    assert(goodSitemap.status === 200, "Sitemap query succeeds with integration key (200)");
    
    const serviceItem = goodSitemap.data.find(i => i.url.endsWith("/services"));
    assert(serviceItem !== undefined, "Discovered sitemap item for /services");
    if (serviceItem) {
      assert(serviceItem.url === "https://my-scaffold.vercel.app/services", "Domain prefix successfully prepended to sitemap item");
      assert(serviceItem.changeFrequency === "daily", "Sitemap change frequency field populated");
      assert(serviceItem.priority === 0.9, "Sitemap priority field populated");
    }

    // 6. Test Programmatic Routes Scan using our workspace SDK
    console.log("\n6. Running local SDK route scanning utility...");
    const { scanRoutes, getAppRouterPath } = await import("../packages/sdk/index.js");
    const scaffoldAppPath = path.resolve(__dirname, "../packages/frontend-scaffold/app");
    
    const scannedRoutes = scanRoutes(scaffoldAppPath);
    assert(scannedRoutes.length > 0, `Scanned and discovered ${scannedRoutes.length} local routes dynamically`);
    const sitemapRoute = scannedRoutes.find(r => r.slug.includes("sitemap"));
    assert(!sitemapRoute, "Correctly ignored non-page files (e.g. sitemap.ts) from route lists");

    const slugRoute = scannedRoutes.find(r => r.slug === "/");
    assert(slugRoute !== undefined, "Correctly resolved home root folder optional catch-all [[...slug]] to '/' path");

    // 7. Validate POST /api/integrations/next-sync/manifest Ingestion & status metrics
    console.log("\n7. Testing manifest ingestion & status diagnostics...");
    const manifestPayload = {
      siteId: SITE_ID,
      source: "auto-sync-script",
      generatedAt: new Date().toISOString(),
      routes: scannedRoutes
    };

    const manifestRes = await request("POST", "/api/integrations/next-sync/manifest", manifestPayload, {
      "x-integration-key": INTEGRATION_KEY
    });
    assert(manifestRes.status === 200, "Manifest ingestion succeeds (200)");
    assert(manifestRes.data.manifestHash !== undefined, "Ingestion response returned manifest hash");

    const statusRes = await request("GET", `/api/integrations/next-sync/status?siteId=${SITE_ID}`, null, {
      "x-integration-key": INTEGRATION_KEY
    });
    assert(statusRes.status === 200, "Sync status status checks succeed (200)");
    assert(statusRes.data.lastManifestHash === manifestRes.data.manifestHash, "Diagnostics report lists matching manifest hash");
    assert(statusRes.data.syncedRoutes?.length > 0, "Diagnostics report lists active synced routes");

    // Clean up
    console.log("\nCleaning up verification records...");
    await prisma.section.deleteMany({ where: { page: { siteId: SITE_ID } } });
    await prisma.syncedRoute.deleteMany({ where: { page: { siteId: SITE_ID } } });
    await prisma.page.deleteMany({ where: { siteId: SITE_ID } });
    await prisma.post.deleteMany({ where: { siteId: SITE_ID } });
    await prisma.integrationManifest.deleteMany({ where: { siteId: SITE_ID } });
    await prisma.frontendProject.deleteMany({ where: { siteId: SITE_ID } });
    await prisma.globalSettings.deleteMany({ where: { siteId: SITE_ID } });
    await prisma.site.delete({ where: { id: SITE_ID } });

  } catch (error) {
    console.error("Test execution failed with error:", error);
    failures++;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }

  console.log("\n====================================================");
  if (failures === 0) {
    console.log("🎉 ALL BRIDGE & AUTO-SYNC FUNCTIONALITIES VERIFIED SUCCESSFULLY!");
  } else {
    console.log(`❌ BRIDGE VERIFICATION FINISHED WITH ${failures} FAILURE(S).`);
  }
  console.log("====================================================");
}

verifyAll();
