const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pg = require("pg");
require("dotenv").config();

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const alerts = await prisma.notificationAlert.findMany({
    orderBy: { createdAt: "desc" },
    take: 10
  });
  console.log("LAST 10 ALERTS:", alerts);

  const errors = await prisma.systemErrorLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 10
  });
  console.log("LAST 10 SYSTEM ERRORS:", errors);

  await prisma.$disconnect();
  await pool.end();
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
