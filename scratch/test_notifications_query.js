require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Checking prisma model keys:");
  const keys = Object.keys(prisma).filter(k => !k.startsWith("_") && !k.startsWith("$"));
  console.log(keys);

  try {
    console.log("Querying notificationAlert table...");
    const count = await prisma.notificationAlert.count();
    console.log("Success! Count of alerts:", count);
  } catch (err) {
    console.error("Querying notificationAlert failed:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
