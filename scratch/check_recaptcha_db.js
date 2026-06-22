require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pg = require("pg");

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const sites = await prisma.site.findMany();
  console.log("Sites in DB:", sites);

  const settings = await prisma.globalSettings.findMany();
  for (const s of settings) {
    console.log(`Site ID: ${s.siteId}`);
    console.log(`Security Controls:`, s.securityControls);
  }

  const pages = await prisma.page.findMany();
  console.log("Pages in DB:", pages.map(p => ({ id: p.id, title: p.title, slug: p.slug })));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
