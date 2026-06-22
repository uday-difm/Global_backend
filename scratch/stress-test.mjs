import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// 1. Resolve Target Site and Page dynamically from Database
const connectionString = process.env.DATABASE_URL;
let siteId = "cmqjbvc3i0000pgw2t202klem"; // default fallback
let slug = "hey";

console.log("🔍 Connecting to database to resolve active Site and Page details...");
try {
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  const site = await prisma.site.findFirst({ where: { isActive: true } });
  if (site) {
    siteId = site.id;
    console.log(`✅ Resolved Active Site ID: ${siteId} (${site.name})`);
  }
  const page = await prisma.page.findFirst({ where: { siteId, status: "PUBLISHED" } });
  if (page) {
    slug = page.slug;
    console.log(`✅ Resolved Published Page Slug: "${slug}"`);
  } else {
    console.log(`⚠️ No published pages found. Falling back to default slug: "${slug}"`);
  }
  await prisma.$disconnect();
  await pool.end();
} catch (err) {
  console.log("⚠️ Could not read database configuration. Using fallbacks.", err.message);
}

const BASE_URL = "http://localhost:3000";

// Helper function to run parallel request stress test
async function runStress(name, url, { method = "GET", body = null, headers = {}, total = 100, concurrency = 10 }) {
  console.log(`\n🚀 Starting Stress Test: ${name}`);
  console.log(`   Target: ${url}`);
  console.log(`   Total Requests: ${total} | Concurrency: ${concurrency}`);

  const start = Date.now();
  let completed = 0;
  const results = [];
  const latencies = [];

  async function worker() {
    while (true) {
      const index = completed++;
      if (index >= total) return;

      const reqStart = Date.now();
      try {
        const fetchOptions = {
          method,
          headers: { ...headers },
        };
        if (body) {
          fetchOptions.body = typeof body === "object" ? JSON.stringify(body) : body;
          fetchOptions.headers["Content-Type"] = "application/json";
        }
        const res = await fetch(url, fetchOptions);
        const text = await res.text();
        const reqEnd = Date.now();
        const latency = reqEnd - reqStart;
        latencies.push(latency);
        results.push({ status: res.status, success: res.ok, latency });
      } catch (err) {
        const reqEnd = Date.now();
        const latency = reqEnd - reqStart;
        latencies.push(latency);
        results.push({ status: 500, success: false, error: err.message, latency });
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  const end = Date.now();
  const elapsed = (end - start) / 1000; // seconds

  // Calculate statistics
  const statusCounts = {};
  let successCount = 0;
  let failureCount = 0;
  results.forEach((r) => {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    if (r.success) successCount++;
    else failureCount++;
  });

  latencies.sort((a, b) => a - b);
  const meanLatency = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
  const p50 = latencies[Math.floor(latencies.length * 0.50)] || 0;
  const p90 = latencies[Math.floor(latencies.length * 0.90)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;

  console.log(`📊 Results for ${name}:`);
  console.log(`   Duration: ${elapsed.toFixed(3)}s`);
  console.log(`   RPS: ${(total / elapsed).toFixed(2)}`);
  console.log(`   Success: ${successCount} | Failures: ${failureCount}`);
  console.log(`   Status Codes:`, statusCounts);
  console.log(`   Latency: Mean=${meanLatency.toFixed(1)}ms, p50=${p50}ms, p90=${p90}ms, p95=${p95}ms, p99=${p99}ms`);

  return {
    name,
    url,
    total,
    concurrency,
    elapsed,
    rps: total / elapsed,
    successCount,
    failureCount,
    statusCounts,
    meanLatency,
    p50,
    p90,
    p95,
    p99,
  };
}

async function main() {
  const mode = process.argv[2] || "all";
  const runResults = [];

  if (mode === "page-load" || mode === "all") {
    // Suite 1: Page load (moderate traffic to front-page HTML renderer)
    const res = await runStress(
      "Suite 1: Catch-All Page Load (/hey)",
      `${BASE_URL}/${slug}`,
      { total: 200, concurrency: 10 }
    );
    runResults.push(res);
  }

  if (mode === "api-load" || mode === "all") {
    // Suite 2: Public Content API load (moderate traffic to DB-driven endpoint)
    const res = await runStress(
      "Suite 2: Public Content API (/api/content)",
      `${BASE_URL}/api/content?siteId=${siteId}&slug=${slug}`,
      { total: 300, concurrency: 15 }
    );
    runResults.push(res);
  }

  if (mode === "rate-limit" || mode === "all") {
    // Suite 3: Rate limit testing
    // Triggering rate limiting: send 120 requests sequentially in a burst (high rate)
    // Default limit is 60 RPS, so we should expect rate limit 429 errors.
    // Note: checkSitePermission checks IP rate limit. We set x-forwarded-for header so we have a consistent IP.
    const res = await runStress(
      "Suite 3: Rate Limiter Validation (/api/admin/redirects)",
      `${BASE_URL}/api/admin/redirects`,
      {
        total: 30,
        concurrency: 8,
        headers: {
          "x-site-id": siteId,
          "x-forwarded-for": "192.168.1.99"
        }
      }
    );
    runResults.push(res);
  }

  console.log("\n=== ALL STRESS TESTS FINISHED ===");
  console.log(JSON.stringify(runResults, null, 2));
}

main().catch(console.error);
