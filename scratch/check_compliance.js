require("dotenv").config();
const prisma = require("../src/lib/prisma").default;

async function main() {
  const settings = await prisma.globalSettings.findUnique({
    where: { siteId: "layman_litigation" },
  });
  console.log("Global Settings compliance:", JSON.stringify(settings?.compliance, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
