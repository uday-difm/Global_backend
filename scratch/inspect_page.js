require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function inspect() {
  try {
    const pageId = "cmqkquhje000290uhtq7j9ibd";
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      include: {
        site: true,
        sections: { where: { isDeleted: false } }
      }
    });
    console.log("PAGE RECORD IN DB:", JSON.stringify(page, null, 2));

    const users = await prisma.user.findMany({
      include: {
        sites: true
      }
    });
    console.log("ALL USERS:", JSON.stringify(users, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

inspect();
