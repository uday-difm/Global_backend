import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const sites = await prisma.site.findMany();
  console.log("SITES in DB:", JSON.stringify(sites, null, 2));

  const pages = await prisma.page.findMany();
  console.log("PAGES in DB:", JSON.stringify(pages, null, 2));
  
  const users = await prisma.user.findMany();
  console.log("USERS in DB:", JSON.stringify(users.map(u => ({ id: u.id, email: u.email, globalRole: u.globalRole })), null, 2));
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
