require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function bootstrap() {
  const args = process.argv.slice(2).reduce((acc, arg) => {
    const [key, val] = arg.split("=");
    acc[key.replace(/^--/, "")] = val || true;
    return acc;
  }, {});

  const siteName = args.name || "Layman Litigation";
  const customId = args.id || null;

  const integrationKey = `gkey_${crypto.randomBytes(24).toString("hex")}`;

  const site = await prisma.site.create({
    data: {
      ...(customId ? { id: customId } : {}),
      name: siteName,
      isActive: true,
      domain: "localhost",
      integrationKey,
    },
  });
  console.log(`Site created: ${site.name} (ID: ${site.id})`);

  await prisma.globalSettings.create({
    data: { siteId: site.id, emailSettings: {} },
  });
  console.log("Global settings created");

  if (args.env) {
    const envPath = path.resolve(args.env);
    const envContent = `NEXT_PUBLIC_CMS_BASE_URL=http://localhost:3000\nNEXT_PUBLIC_SITE_ID=${site.id}\nCMS_INTEGRATION_KEY=${integrationKey}\n`;
    fs.writeFileSync(envPath, envContent);
    console.log(`Frontend .env written: ${envPath}`);
  }

  console.log(`\nSite ID: ${site.id}`);
  console.log(`Integration Key: ${integrationKey}`);
  await prisma.$disconnect();
}

bootstrap().catch((e) => {
  console.error("Bootstrap failed:", e.message);
  process.exit(1);
});
