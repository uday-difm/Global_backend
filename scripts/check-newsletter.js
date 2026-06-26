const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function check() {
  try {
    const count = await prisma.newsletter.count();
    console.log("Newsletter count:", count);
  } catch (e) {
    console.error("Error:", e.message);
  }
  await prisma.$disconnect();
}
check();
