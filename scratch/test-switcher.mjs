import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not defined in the environment.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Mock function representing the code in src/lib/getSiteForUser.js
// but we pass cookieValue and prisma client to it.
async function testGetSiteForUser(user, cookieValue) {
  if (!user) return null;

  const selectedSiteId = cookieValue;

  if (selectedSiteId) {
    const isSuper = user.globalRole === "SUPERADMIN" || user.globalRole === "ADMIN";
    const membership = isSuper
      ? true
      : await prisma.siteUser.findFirst({
          where: { userId: user.id, siteId: selectedSiteId },
        });

    if (membership) {
      const site = await prisma.site.findUnique({
        where: { id: selectedSiteId },
      });
      if (site && site.isActive && !site.deletedAt) {
        return site;
      }
    }
  }

  // Fallback to default site selection (oldest site or first membership)
  if (user.globalRole === "SUPERADMIN" || user.globalRole === "ADMIN") {
    return prisma.site.findFirst({ where: { isActive: true, deletedAt: null }, orderBy: { createdAt: "asc" } });
  }

  const defaultMembership = await prisma.siteUser.findFirst({
    where: { userId: user.id, site: { isActive: true, deletedAt: null } },
    orderBy: { createdAt: "asc" },
    include: { site: true },
  });

  return defaultMembership?.site || null;
}

async function runTests() {
  console.log("=== RUNNING WORKSPACE SWITCHER LOGIC TESTS ===");
  let failures = 0;
  const assert = (condition, msg) => {
    if (condition) {
      console.log(`[PASS] ${msg}`);
    } else {
      console.error(`[FAIL] ${msg}`);
      failures++;
    }
  };

  try {
    // 1. Create two test sites
    const testSiteA = await prisma.site.create({
      data: { name: "Test Site A", domain: "site-a.local", isActive: true }
    });
    const testSiteB = await prisma.site.create({
      data: { name: "Test Site B", domain: "site-b.local", isActive: true }
    });

    console.log(`Created test sites: Site A (${testSiteA.id}), Site B (${testSiteB.id})`);

    // 2. Create a SUPERADMIN user
    const superadmin = await prisma.user.create({
      data: {
        email: `super-${Date.now()}@example.com`,
        passwordHash: "dummy",
        globalRole: "SUPERADMIN"
      }
    });

    // 3. Create a normal user
    const normalUser = await prisma.user.create({
      data: {
        email: `normal-${Date.now()}@example.com`,
        passwordHash: "dummy",
        globalRole: "VIEWER"
      }
    });

    // Associate normal user to Site A only
    await prisma.siteUser.create({
      data: {
        userId: normalUser.id,
        siteId: testSiteA.id,
        role: "VIEWER"
      }
    });

    console.log("Users created and normal user membership set up.");

    // TEST 1: Superadmin with no cookie resolves to oldest site
    const superNoCookie = await testGetSiteForUser(superadmin, null);
    assert(superNoCookie !== null, "Superadmin with no cookie resolves a site");
    
    // TEST 2: Superadmin with cookie for Site B resolves Site B
    const superCookieB = await testGetSiteForUser(superadmin, testSiteB.id);
    assert(superCookieB?.id === testSiteB.id, "Superadmin cookie switches to Site B");

    // TEST 3: Normal user with no cookie resolves to Site A (their only membership)
    const normalNoCookie = await testGetSiteForUser(normalUser, null);
    assert(normalNoCookie?.id === testSiteA.id, "Normal user with no cookie resolves to Site A (their only membership)");

    // TEST 4: Normal user with cookie for Site B (not member) falls back to Site A
    const normalCookieB = await testGetSiteForUser(normalUser, testSiteB.id);
    assert(normalCookieB?.id === testSiteA.id, "Normal user cookie for unauthorized Site B falls back to Site A");

    // TEST 5: Normal user with cookie for Site A resolves Site A
    const normalCookieA = await testGetSiteForUser(normalUser, testSiteA.id);
    assert(normalCookieA?.id === testSiteA.id, "Normal user cookie for authorized Site A resolves Site A");

    // Cleanup
    await prisma.siteUser.deleteMany({ where: { userId: normalUser.id } });
    await prisma.user.deleteMany({ where: { id: { in: [superadmin.id, normalUser.id] } } });
    await prisma.site.deleteMany({ where: { id: { in: [testSiteA.id, testSiteB.id] } } });
    console.log("Cleaned up test data.");

  } catch (error) {
    console.error("Test execution error:", error);
    failures++;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }

  if (failures > 0) {
    console.error(`=== WORKSPACE SWITCHER TESTS COMPLETED WITH ${failures} FAILURES ===`);
    process.exit(1);
  } else {
    console.log("=== ALL WORKSPACE SWITCHER TESTS PASSED SUCCESSFULLY ===");
    process.exit(0);
  }
}

runTests();
