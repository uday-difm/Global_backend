const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pg = require("pg");
require("dotenv").config();

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const sites = await prisma.site.findMany();
  console.log("SITES IN DATABASE:", sites);
  await prisma.$disconnect();
  await pool.end();
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
