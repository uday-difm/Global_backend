const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
async function main() {
  const pages = await prisma.page.findMany({
    select: { slug: true, title: true, status: true, siteId: true, deletedAt: true },
    orderBy: { createdAt: 'asc' }
  });
  console.log('=== PAGES IN DB ===');
  console.log(JSON.stringify(pages, null, 2));
  const sites = await prisma.site.findMany({ select: { id: true, name: true, domain: true } });
  console.log('=== SITES IN DB ===');
  console.log(JSON.stringify(sites, null, 2));
  await prisma.$disconnect();
}
main().catch(console.error);
