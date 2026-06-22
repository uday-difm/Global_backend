const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

async function main() {
  const pg = require("pg");
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("Checking Error Logs...");
  const logs = await prisma.systemErrorLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 5
  });
  console.log(JSON.stringify(logs, null, 2));

  await prisma.$disconnect();
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
