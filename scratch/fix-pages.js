require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SITE_ID = 'layman_litigation';

async function main() {
  // 1. Publish the /services page that exists but is DRAFT
  const servicePages = await prisma.page.findMany({
    where: { siteId: SITE_ID, slug: { in: ['/services', 'services'] }, deletedAt: null }
  });
  console.log('Service pages found:', servicePages.map(p => ({ slug: p.slug, status: p.status })));
  
  for (const p of servicePages) {
    await prisma.page.update({
      where: { id: p.id },
      data: { status: 'PUBLISHED', publishedAt: new Date() }
    });
    console.log(`Published: ${p.slug}`);
  }

  // 2. Check if /blogs page exists, if not create it (for [slug] catch-all)
  const blogPage = await prisma.page.findFirst({
    where: { siteId: SITE_ID, slug: { in: ['/blogs', 'blogs'] }, deletedAt: null }
  });
  if (!blogPage) {
    await prisma.page.create({
      data: {
        siteId: SITE_ID,
        title: 'Blog',
        slug: 'blogs',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        isManagedBySync: false,
        isHardcoded: true,
        sourceRoute: '/blogs',
        seoTitle: 'Legal Blog & Insights | Layman Litigation',
        seoDescription: 'Expert legal articles and guides covering civil litigation, criminal defense, family law, and more.',
        sections: {
          create: []
        }
      }
    });
    console.log('Created /blogs page');
  } else {
    if (blogPage.status !== 'PUBLISHED') {
      await prisma.page.update({ where: { id: blogPage.id }, data: { status: 'PUBLISHED', publishedAt: new Date() } });
    }
    console.log('Blog page already exists:', blogPage.slug);
  }

  // 3. Check legal page API to make sure legal pages are published
  const legalPages = await prisma.legalPage.findMany({
    where: { siteId: SITE_ID, deletedAt: null },
    select: { type: true, title: true, published: true }
  });
  console.log('Legal pages:', legalPages);
  
  // Publish all legal pages
  await prisma.legalPage.updateMany({
    where: { siteId: SITE_ID, deletedAt: null },
    data: { published: true }
  });
  console.log('All legal pages published');

  // 4. List all pages for layman_litigation to confirm state
  const allPages = await prisma.page.findMany({
    where: { siteId: SITE_ID, deletedAt: null },
    select: { slug: true, title: true, status: true },
    orderBy: { createdAt: 'asc' }
  });
  console.log('\n=== Final page state ===');
  allPages.forEach(p => console.log(`  ${p.status.padEnd(10)} ${p.slug}`));

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
