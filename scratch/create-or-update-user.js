const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pg = require("pg");
const bcrypt = require("bcryptjs");

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const email = "admin@example.com";
  const password = "Admin@123";
  const hash = bcrypt.hashSync(password, 10);

  console.log(`Updating password for ${email}...`);
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: hash,
      isActive: true
    },
    create: {
      email,
      passwordHash: hash,
      globalRole: "SUPERADMIN",
      isActive: true
    }
  });

  console.log("Success! Updated user:", user.email);

  await prisma.$disconnect();
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
