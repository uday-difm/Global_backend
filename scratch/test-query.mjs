import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

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
    console.log("Categories:", categories);
  } catch (err) {
    console.error("Prisma query failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
