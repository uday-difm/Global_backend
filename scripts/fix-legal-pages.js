/**
 * Fix legal pages — clear contentJson for pages that have HTML content
 */
require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SITE_ID = "layman_litigation";

const LEGAL_CONTENT = {
  privacy: `<h2>Privacy Policy</h2>
<p>Last updated: June 2026</p>
<p>Layman Litigation ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.</p>
<h3>Information We Collect</h3>
<p>We may collect personal information that you voluntarily provide to us when you fill out contact forms, subscribe to our newsletter, or communicate with us. This may include your name, email address, phone number, and information about your legal matter.</p>
<h3>How We Use Your Information</h3>
<p>We use the information we collect to respond to your inquiries, provide legal services, send relevant updates and newsletters (with your consent), improve our website, and comply with legal obligations.</p>
<h3>Data Protection</h3>
<p>We implement appropriate technical and organizational measures to protect your personal information. However, no electronic transmission over the internet is 100% secure.</p>
<h3>Your Rights</h3>
<p>You have the right to access, correct, or delete your personal information. You may also opt out of marketing communications at any time.</p>
<h3>Contact Us</h3>
<p>If you have questions about this Privacy Policy, please contact us at privacy@laymanlitigation.com.</p>`,
};

async function fix() {
  // Fix legal pages where content exists but contentJson should be null for HTML
  const legalPages = await prisma.legalPage.findMany({
    where: { siteId: SITE_ID },
  });

  for (const page of legalPages) {
    const updates = {};

    // If page has HTML content (starts with <), clear contentJson so the frontend renders the HTML
    if (page.content && page.content.trim().startsWith("<")) {
      updates.contentJson = null;
    }

    // Update privacy page specifically with proper content
    if (page.type === "privacy" && LEGAL_CONTENT[page.type]) {
      updates.content = LEGAL_CONTENT[page.type];
      updates.contentJson = null;
    }

    if (Object.keys(updates).length > 0) {
      await prisma.legalPage.update({
        where: { id: page.id },
        data: updates,
      });
      console.log(`  ✅ Fixed legal page: ${page.type} (${page.title})`);
    }
  }

  console.log("\n✅ Legal pages fixed!");
  await prisma.$disconnect();
}

fix().catch((e) => {
  console.error("Fix failed:", e);
  process.exit(1);
});
