const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function check() {
  const all = await prisma.service.findMany({
    where: { siteId: "layman_litigation" },
  });
  console.log("Total services:", all.length);
  for (const s of all) {
    console.log(`  ${s.title}: status=${s.status} visible=${s.visible}`);
  }
  await prisma.$disconnect();
}
check();
