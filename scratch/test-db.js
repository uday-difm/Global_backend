const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const sites = await prisma.site.findMany();
  console.log("SITES in DB:", JSON.stringify(sites, null, 2));

  const pages = await prisma.page.findMany();
  console.log("PAGES in DB:", JSON.stringify(pages, null, 2));
  
  const users = await prisma.user.findMany();
  console.log("USERS in DB:", JSON.stringify(users.map(u => ({ id: u.id, email: u.email, globalRole: u.globalRole })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
