const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:123@localhost:5432/global_backend";

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const pages = await prisma.legalPage.findMany({
    where: { siteId: 'layman_litigation', type: 'privacy' },
    select: { id: true, type: true, title: true, published: true, deletedAt: true }
  });
  console.log("Privacy legal page records:", pages);
  await prisma.$disconnect();
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
