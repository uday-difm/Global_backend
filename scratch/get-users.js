const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pg = require("pg");

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("Fetching users...");
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      globalRole: true,
      createdAt: true
    }
  });
  console.log("Users in DB:");
  console.log(JSON.stringify(users, null, 2));

  await prisma.$disconnect();
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
