const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:123@localhost:5432/global_backend";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const settings = await prisma.globalSettings.findUnique({
      where: { siteId: "layman_litigation" },
      select: { footer: true }
    });
    console.log("FOOTER CONFIG FOR layman_litigation:", JSON.stringify(settings?.footer, null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
