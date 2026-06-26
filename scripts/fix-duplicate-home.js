const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const SITE_ID = "layman_litigation";

async function run() {
  // Delete synced pages with slug "/" and "/[...slug]" and "/legal/privacy"
  for (const slug of ["/", "/[...slug]", "/legal/privacy"]) {
    const page = await prisma.page.findFirst({ where: { siteId: SITE_ID, slug } });
    if (page) {
      await prisma.section.deleteMany({ where: { pageId: page.id } });
      await prisma.page.delete({ where: { id: page.id } });
      console.log("Deleted:", slug);
    }
  }
  await prisma.$disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
