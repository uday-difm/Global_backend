const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = "postgresql://postgres:123@localhost:5432/global_backend";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const section = await prisma.section.findUnique({
      where: { id: "cmqqflpzh000f8wuh3hwxu1vv" }
    });
    console.log("Section Details:", JSON.stringify(section, null, 2));
    
    // Also fetch recent system error logs
    const logs = await prisma.systemErrorLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5
    });
    console.log("Recent Error Logs:", JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error("Failed to inspect section:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
