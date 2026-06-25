const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:123@localhost:5432/global_backend";

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const pages = await prisma.page.findMany({
    where: { siteId: 'layman_litigation' },
    select: { id: true, slug: true, status: true, title: true, deletedAt: true }
  });
  console.log("Pages for layman_litigation with deletedAt:", pages);
  await prisma.$disconnect();
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
