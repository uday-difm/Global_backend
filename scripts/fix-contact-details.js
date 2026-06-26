/**
 * Fix business hours format — convert from object to array format
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
    select: { contactDetails: true },
  });

  const contact = settings?.contactDetails || {};

  // Fix businessHours if it's an object instead of array
  if (contact.businessHours && !Array.isArray(contact.businessHours)) {
    const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    const hoursArray = DAYS.map((key, i) => {
      const val = contact.businessHours[key];
      if (!val || val === "Closed") {
        return { day: DAY_NAMES[i], open: "", close: "", closed: true };
      }
      const parts = val.split(" - ");
      return {
        day: DAY_NAMES[i],
        open: parts[0] || "",
        close: parts[1] || "",
        closed: false,
      };
    });

    contact.businessHours = hoursArray;
    console.log("Fixed business hours: converted object to array");
  }

  // Fix socialLinks — rename to socials if needed
  if (contact.socialLinks && !contact.socials) {
    contact.socials = contact.socialLinks;
    delete contact.socialLinks;
    console.log("Fixed social links: renamed socialLinks -> socials");
  }

  await prisma.globalSettings.update({
    where: { siteId: SITE_ID },
    data: { contactDetails: contact },
  });

  console.log("✅ Contact details fixed!");
  await prisma.$disconnect();
}

fix().catch((e) => {
  console.error("Fix failed:", e);
  process.exit(1);
});
