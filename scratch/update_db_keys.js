require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pg = require("pg");

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!siteKey || !secretKey) {
    console.error("Site key or secret key missing in .env!");
    process.exit(1);
  }

  console.log("Updating database keys to match .env...");
  console.log(`Site Key: ${siteKey}`);
  console.log(`Secret Key: ${secretKey}`);

  const activeSite = await prisma.site.findFirst({
    where: { isActive: true, deletedAt: null },
  });

  if (!activeSite) {
    console.error("No active site found in DB!");
    process.exit(1);
  }

  const settings = await prisma.globalSettings.findUnique({
    where: { siteId: activeSite.id },
  });

  const controls = settings?.securityControls || {};
  const updatedControls = {
    ...controls,
    recaptchaSiteKey: siteKey,
    recaptchaSecretKey: secretKey,
  };

  await prisma.globalSettings.update({
    where: { siteId: activeSite.id },
    data: { securityControls: updatedControls },
  });

  console.log("✅ Successfully updated database security controls to match .env!");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
