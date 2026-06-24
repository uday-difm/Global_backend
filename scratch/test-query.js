const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = "postgresql://postgres:123@localhost:5432/global_backend";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const site = await prisma.site.findFirst({
      where: { isActive: true, deletedAt: null }
    });
    if (!site) {
      console.log("No active site found.");
      return;
    }
    console.log("Active site ID:", site.id);
    
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            posts: {
              where: { siteId: site.id, deletedAt: null }
            }
          }
        }
      }
    });
    console.log(`Successfully fetched ${categories.length} categories.`);
    console.log("Categories:", JSON.stringify(categories, null, 2));
  } catch (err) {
    console.error("Prisma query failed:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
