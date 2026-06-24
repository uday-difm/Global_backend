const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:123@localhost:5432/global_backend";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const site = await prisma.site.findUnique({
      where: { domain: "layman.local" } // Let's check domains or list all sites
    });
    
    const allSites = await prisma.site.findMany();
    console.log("ALL SITES:", JSON.stringify(allSites, null, 2));

    const targetSiteId = "layman_litigation";
    
    // Find the pages
    const pages = await prisma.page.findMany({
      where: { siteId: targetSiteId },
      select: { id: true, slug: true, title: true, status: true }
    });
    console.log(`PAGES FOR ${targetSiteId}:`, JSON.stringify(pages, null, 2));

    // Find the posts
    const posts = await prisma.post.findMany({
      where: { siteId: targetSiteId },
      include: {
        categories: true
      }
    });
    console.log(`POSTS FOR ${targetSiteId}:`, JSON.stringify(posts.map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      status: p.status,
      categories: p.categories.map(c => ({ id: c.id, name: c.name, slug: c.slug }))
    })), null, 2));

    // Find all categories
    const categories = await prisma.category.findMany();
    console.log("ALL CATEGORIES IN DB:", JSON.stringify(categories, null, 2));

  } catch (err) {
    console.error("Error inspecting database:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
