const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function check() {
  for (const slug of ["about", "practice-areas", "contact", "faqs"]) {
    const page = await prisma.page.findFirst({
      where: { siteId: "layman_litigation", slug },
    });
    if (!page) {
      console.log(slug + ": NOT FOUND");
      continue;
    }
    const sections = await prisma.section.findMany({
      where: { pageId: page.id },
      orderBy: { order: "asc" },
    });
    console.log(
      slug + ": " + page.status + " - " + sections.length + " sections",
    );
    for (const s of sections) {
      console.log(
        "  [" +
          s.type +
          "] " +
          s.name +
          " visible=" +
          s.isVisible +
          " content=" +
          JSON.stringify(s.content).substring(0, 120),
      );
    }
  }
  await prisma.$disconnect();
}
check().catch((e) => {
  console.error(e);
  process.exit(1);
});
