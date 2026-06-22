import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const manifests = await prisma.integrationManifest.findMany({
    include: {
      site: { select: { name: true } }
    }
  });

  console.log("--- INTEGRATION MANIFESTS IN DATABASE ---");
  console.log(`Total: ${manifests.length}`);
  manifests.forEach((m) => {
    console.log(`- Site Name: ${m.site?.name} (SiteID: ${m.siteId})`);
    console.log(`  Created At: ${m.createdAt}`);
    console.log(`  Source: ${m.source}`);
    console.log(`  Routes count: ${m.rawJson?.routes ? m.rawJson.routes.length : 0}`);
    console.log(`  Routes details:`, JSON.stringify(m.rawJson?.routes));
  });

  console.log("\n--- FRONTEND PROJECTS IN DATABASE ---");
  const projects = await prisma.frontendProject.findMany({
    include: {
      site: { select: { name: true } }
    }
  });
  projects.forEach((p) => {
    console.log(`- Project Name: ${p.name} (SiteID: ${p.siteId})`);
    console.log(`  Framework: ${p.framework}`);
    console.log(`  ApiKey: ${p.apiKey}`);
    console.log(`  Sync Status: ${p.syncStatus}`);
  });
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
