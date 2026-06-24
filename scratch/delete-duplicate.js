const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:123@localhost:5432/global_backend";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const deleted = await prisma.page.deleteMany({
      where: {
        siteId: "layman_litigation",
        slug: "/",
        status: "DRAFT"
      }
    });
    console.log("Deleted duplicate pages:", deleted.count);
  } catch (err) {
    console.error("Error deleting duplicate pages:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
