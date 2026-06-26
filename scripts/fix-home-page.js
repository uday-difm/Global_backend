/**
 * Fix home page slug and section types
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SITE_ID = "layman_litigation";

async function fix() {
  // 1. Fix home page slug
  const homePage = await prisma.page.findFirst({
    where: { siteId: SITE_ID, slug: "home" },
  });

  if (homePage) {
    await prisma.page.update({
      where: { id: homePage.id },
      data: { slug: "", sourceRoute: "/" },
    });
    console.log("✅ Home page slug: 'home' -> ''");
  }

  // 2. Fix section types: 'text' -> 'text_block'
  const textSections = await prisma.section.findMany({
    where: { type: "text" },
  });

  for (const section of textSections) {
    await prisma.section.update({
      where: { id: section.id },
      data: { type: "text_block" },
    });
  }
  console.log(
    `✅ Fixed ${textSections.length} sections: 'text' -> 'text_block'`,
  );

  // 3. Publish all pages
  const pages = await prisma.page.findMany({
    where: { siteId: SITE_ID, status: "DRAFT" },
  });
  for (const page of pages) {
    await prisma.page.update({
      where: { id: page.id },
      data: { status: "PUBLISHED" },
    });
    console.log(`  ✅ Published page: ${page.title}`);
  }

  await prisma.$disconnect();
}

fix().catch((e) => {
  console.error("Fix failed:", e);
  process.exit(1);
});
