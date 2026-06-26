/**
 * Fix section content field names to match frontend component expectations
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SITE_ID = "layman_litigation";

async function fix() {
  // Get all sections for the site's pages
  const pages = await prisma.page.findMany({
    where: { siteId: SITE_ID },
    select: { id: true, title: true, slug: true },
  });

  for (const page of pages) {
    const sections = await prisma.section.findMany({
      where: { pageId: page.id },
      orderBy: { order: "asc" },
    });

    for (const section of sections) {
      const content = section.content || {};
      const type = String(section.type || "").toUpperCase();
      let updated = { ...content };
      let changed = false;

      if (type === "HERO") {
        // heading -> title
        if (updated.heading && !updated.title) {
          updated.title = updated.heading;
          delete updated.heading;
          changed = true;
        }
        // subheading -> subtitle
        if (updated.subheading && !updated.subtitle) {
          updated.subtitle = updated.subheading;
          delete updated.subheading;
          changed = true;
        }
        // ctaText/ctaLink -> primaryButton
        if (updated.ctaText && !updated.primaryButton) {
          updated.primaryButton = {
            text: updated.ctaText,
            url: updated.ctaLink || "/",
          };
          delete updated.ctaText;
          delete updated.ctaLink;
          changed = true;
        }
        // secondaryCtaText/secondaryCtaLink -> secondaryButton
        if (updated.secondaryCtaText && !updated.secondaryButton) {
          updated.secondaryButton = {
            text: updated.secondaryCtaText,
            url: updated.secondaryCtaLink || "/",
          };
          delete updated.secondaryCtaText;
          delete updated.secondaryCtaLink;
          changed = true;
        }
        // backgroundImage -> backgroundUrl
        if (updated.backgroundImage && !updated.backgroundUrl) {
          updated.backgroundUrl = updated.backgroundImage;
          delete updated.backgroundImage;
          changed = true;
        }
        // Ensure textColor and alignment exist
        if (!updated.textColor) updated.textColor = "#ffffff";
        if (!updated.alignment) updated.alignment = "left";
        changed = true;
      }

      if (type === "TEXT_BLOCK" || type === "TEXT") {
        // heading -> title
        if (updated.heading && !updated.title) {
          updated.title = updated.heading;
          delete updated.heading;
          changed = true;
        }
        // layout -> imagePosition
        if (updated.layout && !updated.imagePosition) {
          updated.imagePosition = updated.layout === "right" ? "right" : "left";
          delete updated.layout;
          changed = true;
        }
      }

      if (type === "CTA") {
        // heading -> title
        if (updated.heading && !updated.title) {
          updated.title = updated.heading;
          delete updated.heading;
          changed = true;
        }
        // subheading -> subtitle
        if (updated.subheading && !updated.subtitle) {
          updated.subtitle = updated.subheading;
          delete updated.subheading;
          changed = true;
        }
        // ctaText -> primaryButtonText
        if (updated.ctaText && !updated.primaryButtonText) {
          updated.primaryButtonText = updated.ctaText;
          delete updated.ctaText;
          changed = true;
        }
        // ctaLink -> primaryButtonUrl
        if (updated.ctaLink && !updated.primaryButtonUrl) {
          updated.primaryButtonUrl = updated.ctaLink;
          delete updated.ctaLink;
          changed = true;
        }
      }

      if (changed) {
        await prisma.section.update({
          where: { id: section.id },
          data: { content: updated },
        });
        console.log(`  ✅ Fixed ${type} section "${section.name}" in page "${page.title}"`);
      }
    }
  }

  await prisma.$disconnect();
  console.log("\n✅ All section content field names fixed!");
}

fix().catch((e) => {
  console.error("Fix failed:", e);
  process.exit(1);
});
