const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:123@localhost:5432/global_backend";

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function testFrontendRoute() {
  const url = `http://localhost:3001/blogs`;
  console.log(`Fetching frontend route: ${url}`);
  try {
    const res = await fetch(url);
    console.log(`Status: ${res.status}`);
  } catch (err) {
    console.error("Error fetching frontend:", err.message);
  }
}

async function setBlogsStatus(status) {
  console.log(`Updating CMS DB: Setting '/blogs' page status to ${status}...`);
  await prisma.page.update({
    where: { siteId_slug: { siteId: 'layman_litigation', slug: '/blogs' } },
    data: { status }
  });
}

async function main() {
  try {
    console.log("--- 1. Testing with '/blogs' in DRAFT status ---");
    await setBlogsStatus('DRAFT');
    await testFrontendRoute();

    console.log("\n--- 2. Testing with '/blogs' in PUBLISHED status ---");
    await setBlogsStatus('PUBLISHED');
    await testFrontendRoute();

    console.log("\n--- 3. Restoring original '/blogs' DRAFT status ---");
    await setBlogsStatus('DRAFT');
  } catch (e) {
    console.error("Test execution failed:", e);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
