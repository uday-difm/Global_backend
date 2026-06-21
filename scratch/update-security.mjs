import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const rps = process.argv[2] ? parseInt(process.argv[2], 10) : null;
  const val = rps ? { rateLimitRps: rps } : null;
  
  await prisma.globalSettings.update({
    where: { siteId: "cmqjbvc3i0000pgw2t202klem" },
    data: { securityControls: val }
  });
  console.log(`✅ Updated securityControls to:`, val);
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
