const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = "postgresql://postgres:123@localhost:5432/global_backend";

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function test() {
  try {
    const res = await prisma.media.findMany({
      where: { deletedAt: null }
    });
    console.log("SUCCESS Media query, found count:", res.length);

    const folderRes = await prisma.mediaFolder.findMany({
      where: { deletedAt: null }
    });
    console.log("SUCCESS MediaFolder query, found count:", folderRes.length);
  } catch (err) {
    console.error("ERROR during query:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}
test();
