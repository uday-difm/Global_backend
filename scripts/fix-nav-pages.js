/**
 * Fix missing pages and navigation links
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SITE_ID = "layman_litigation";

async function fix() {
  // 1. Fix navigation URLs: /faq -> /faqs
  const settings = await prisma.globalSettings.findUnique({
    where: { siteId: SITE_ID },
    select: { navigation: true },
  });

  const nav = settings?.navigation || {};

  function fixNavItems(items) {
    if (!items || !Array.isArray(items)) return items;
    return items.map((item) => {
      const fixed = { ...item };
      if (fixed.url === "/faq") fixed.url = "/faqs";
      if (fixed.children && fixed.children.length) {
        fixed.children = fixNavItems(fixed.children);
      }
      return fixed;
    });
  }

  if (nav.main) nav.main = fixNavItems(nav.main);
  if (nav.footer) nav.footer = fixNavItems(nav.footer);

  await prisma.globalSettings.update({
    where: { siteId: SITE_ID },
    data: { navigation: nav },
  });
  console.log("✅ Navigation links fixed: /faq -> /faqs");

  // 2. Create /practice-areas page
  const existingPracticeAreas = await prisma.page.findFirst({
    where: { siteId: SITE_ID, slug: "practice-areas" },
  });
  if (!existingPracticeAreas) {
    await prisma.page.create({
      data: {
        siteId: SITE_ID,
        title: "Practice Areas",
        slug: "practice-areas",
        status: "PUBLISHED",
        isManagedBySync: false,
        sourceRoute: "/practice-areas",
        seoTitle: "Practice Areas | Layman Litigation",
        seoDescription: "Explore our comprehensive legal services including civil litigation, criminal defense, family law, business law, and real estate law.",
        sections: {
          create: [
            {
              type: "hero",
              name: "Practice Areas Hero",
              order: 0,
              content: {
                heading: "Our Practice Areas",
                subheading: "Comprehensive legal services tailored to your needs",
                alignment: "center",
                textColor: "#1e3a5f",
              },
            },
            {
              type: "services",
              name: "Practice Areas List",
              order: 1,
              content: {
                heading: "Areas of Expertise",
                subheading: "",
                bgColor: "#ffffff",
              },
            },
            {
              type: "cta",
              name: "Practice Areas CTA",
              order: 2,
              content: {
                heading: "Need Help with a Legal Matter?",
                subheading: "Schedule a free consultation with our experienced attorneys today.",
                ctaText: "Contact Us",
                ctaLink: "/contact",
                bgColor: "#1e3a5f",
                textColor: "#ffffff",
              },
            },
          ],
        },
      },
    });
    console.log("✅ Created /practice-areas page");
  } else {
    console.log("✅ /practice-areas page already exists");
  }

  // 3. Make sure /faqs page exists (was created as /faqs by seed)
  const faqsPage = await prisma.page.findFirst({
    where: { siteId: SITE_ID, slug: "faqs" },
  });
  if (faqsPage) {
    // Already exists
    console.log("✅ /faqs page exists");
  }

  await prisma.$disconnect();
}

fix().catch((e) => {
  console.error("Fix failed:", e);
  process.exit(1);
});
