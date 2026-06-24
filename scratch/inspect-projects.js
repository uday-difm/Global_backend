const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = "postgresql://postgres:123@localhost:5432/global_backend";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const projects = await prisma.frontendProject.findMany();
    console.log("Frontend Projects:", JSON.stringify(projects, null, 2));
  } catch (err) {
    console.error("Failed to fetch projects:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
