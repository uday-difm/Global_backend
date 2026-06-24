const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = "postgresql://postgres:123@localhost:5432/global_backend";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const pages = await prisma.legalPage.findMany({
      where: { siteId: "layman_litigation", deletedAt: null }
    });
    console.log("Configured Legal Pages for layman_litigation:", JSON.stringify(pages, null, 2));
  } catch (err) {
    console.error("Failed to inspect legal pages:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
