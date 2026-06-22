import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const secs = await prisma.section.findMany({
    where: { pageId: "cmqjvsw0h0000low2kns10zeu" },
    orderBy: { order: "asc" }
  });
  console.log("SECTIONS IN DB (order: asc):");
  console.log(JSON.stringify(secs.map(s => ({ id: s.id, type: s.type, order: s.order })), null, 2));
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
