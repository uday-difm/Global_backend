const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:123@localhost:5432/global_backend";

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function testRoute(slug) {
  const url = `http://localhost:3005/api/legal/${encodeURIComponent(slug)}?siteId=layman_litigation`;
  console.log(`Fetching: ${url}`);
  try {
    const res = await fetch(url);
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    if (res.status === 200) {
      console.log("Success: Title is:", data.legalPage.title);
    } else {
      console.log("Error:", data);
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

async function setPublishedStatus(published) {
  console.log(`Updating DB: Setting published to ${published}...`);
  await prisma.legalPage.update({
    where: { id: 'cmqqghbje000i8wuhxfii3tb9' },
    data: { published }
  });
}

async function main() {
  try {
    console.log("--- 1. Testing Published Privacy Page ---");
    await setPublishedStatus(true);
    await testRoute("privacy");

    console.log("\n--- 2. Testing Unpublished Privacy Page (DRAFT) ---");
    await setPublishedStatus(false);
    await testRoute("privacy");

    console.log("\n--- 3. Restoring original database state ---");
    await setPublishedStatus(true);
  } catch (e) {
    console.error("Test execution failed:", e);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
