const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SITE_ID = "layman_litigation";

async function fix() {
  // 1. Fix About page sections - add title and imageUrl
  const aboutPage = await prisma.page.findFirst({ where: { siteId: SITE_ID, slug: "about" } });
  if (aboutPage) {
    // Update "Our Story" section with title and image
    const ourStory = await prisma.section.findFirst({ where: { pageId: aboutPage.id, name: "Our Story" } });
    if (ourStory) {
      await prisma.section.update({
        where: { id: ourStory.id },
        data: {
          content: {
            ...ourStory.content,
            title: "Our Story",
            imageUrl: "https://images.unsplash.com/photo-1577415124269-fc1140a69e91?w=800",
            imagePosition: "left",
          }
        }
      });
      console.log("✅ About - Our Story: added title and image");
    }
  }

  // 2. Create Services records
  const existingServices = await prisma.service.count({ where: { siteId: SITE_ID } });
  if (existingServices === 0) {
    const services = [
      { title: "Civil Litigation", description: "Representation in contract disputes, personal injury claims, property disputes, and more.", price: "From $500", ctaButtonText: "Learn More", ctaButtonLink: "/practice-areas/civil-litigation", sortOrder: 0, status: "ACTIVE", visible: true },
      { title: "Criminal Defense", description: "Aggressive defense for misdemeanor and felony charges. Protecting your rights and freedom.", price: "From $1,000", ctaButtonText: "Learn More", ctaButtonLink: "/practice-areas/criminal-defense", sortOrder: 1, status: "ACTIVE", visible: true },
      { title: "Family Law", description: "Divorce, child custody, child support, adoption, and domestic violence matters.", price: "From $300", ctaButtonText: "Learn More", ctaButtonLink: "/practice-areas/family-law", sortOrder: 2, status: "ACTIVE", visible: true },
      { title: "Business Law", description: "Business formation, contracts, mergers, intellectual property, and employment law.", price: "Contact Us", ctaButtonText: "Learn More", ctaButtonLink: "/practice-areas/business-law", sortOrder: 3, status: "ACTIVE", visible: true },
      { title: "Real Estate Law", description: "Property transactions, title searches, landlord-tenant disputes, and zoning issues.", price: "From $750", ctaButtonText: "Learn More", ctaButtonLink: "/practice-areas/real-estate-law", sortOrder: 4, status: "ACTIVE", visible: true },
      { title: "Estate Planning", description: "Wills, trusts, powers of attorney, and probate administration services.", price: "From $400", ctaButtonText: "Learn More", ctaButtonLink: "/estate-planning", sortOrder: 5, status: "ACTIVE", visible: true },
    ];
    for (const svc of services) {
      await prisma.service.create({ data: { siteId: SITE_ID, ...svc } });
    }
    console.log("✅ Created " + services.length + " service records");
  } else {
    console.log("✅ Services already exist: " + existingServices);
  }

  // 3. Fix Practice Areas page - update services section heading -> title
  const paPage = await prisma.page.findFirst({ where: { siteId: SITE_ID, slug: "practice-areas" } });
  if (paPage) {
    const svcSection = await prisma.section.findFirst({ where: { pageId: paPage.id, type: "services" } });
    if (svcSection && svcSection.content.heading) {
      await prisma.section.update({
        where: { id: svcSection.id },
        data: { content: { ...svcSection.content, title: svcSection.content.heading, subtitle: svcSection.content.subheading } }
      });
      console.log("✅ Practice Areas - services section fixed");
    }
  }

  // 4. Add contact_form section to Contact page
  const contactPage = await prisma.page.findFirst({ where: { siteId: SITE_ID, slug: "contact" } });
  if (contactPage) {
    const existingForm = await prisma.section.findFirst({ where: { pageId: contactPage.id, type: "contact_form" } });
    if (!existingForm) {
      await prisma.section.create({
        data: {
          pageId: contactPage.id,
          type: "contact_form",
          name: "Contact Form",
          order: 1,
          isVisible: true,
          content: {
            title: "Send Us a Message",
            subtitle: "Fill out the form below and we'll get back to you within 24 hours.",
            submitText: "Send Message",
          }
        }
      });
      console.log("✅ Contact page - added contact_form section");
    }
  }

  await prisma.$disconnect();
  console.log("\n✅ All fixes applied!");
}
fix().catch(e => { console.error(e); process.exit(1); });
