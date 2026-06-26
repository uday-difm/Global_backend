/**
 * Fix navigation data structure - navigation should be stored as arrays, not wrapped objects
 */
require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SITE_ID = "layman_litigation";

async function fix() {
  const settings = await prisma.globalSettings.findUnique({
    where: { siteId: SITE_ID },
    select: { navigation: true },
  });

  const nav = settings?.navigation || {};
  console.log("Current navigation structure:", JSON.stringify(nav, null, 2).slice(0, 300));

  // Fix: extract the items array from the wrapped object
  const fixedNav = {};
  for (const [key, value] of Object.entries(nav)) {
    if (value && typeof value === "object" && value.items && Array.isArray(value.items)) {
      // Was stored as { menuType: "main", items: [...] }, extract just the array
      fixedNav[key] = value.items;
    } else if (Array.isArray(value)) {
      fixedNav[key] = value;
    } else {
      fixedNav[key] = value;
    }
  }

  console.log("\nFixed navigation structure:", JSON.stringify(fixedNav, null, 2).slice(0, 300));

  await prisma.globalSettings.update({
    where: { siteId: SITE_ID },
    data: { navigation: fixedNav },
  });

  console.log("\n✅ Navigation fixed!");
  await prisma.$disconnect();
}

fix().catch((e) => {
  console.error("Fix failed:", e);
  process.exit(1);
});
