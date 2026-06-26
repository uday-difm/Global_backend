require('dotenv/config');
const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  // Find the default site
  const defaultSite = await prisma.site.findFirst({ where: { isActive: true, deletedAt: null }, orderBy: { createdAt: 'asc' } });
  if (!defaultSite) { console.log('No default site found'); return; }

  console.log('Default site:', defaultSite.id, defaultSite.name);

  // Check if it already has GlobalSettings
  const existing = await prisma.globalSettings.findUnique({ where: { siteId: defaultSite.id } });
  if (existing) {
    console.log('Already has GlobalSettings, updating navigation...');
    await prisma.globalSettings.update({
      where: { siteId: defaultSite.id },
      data: {
        navigation: {
          main: [
            { url: '/', type: 'internal', label: 'Home', children: [] },
            { url: '/about', type: 'internal', label: 'About', children: [] },
            { url: '/services', type: 'internal', label: 'Services', children: [
              { url: '/services/web-dev', type: 'internal', label: 'Web Development' },
              { url: '/services/consulting', type: 'internal', label: 'Consulting' },
            ]},
            { url: '/blog', type: 'internal', label: 'Blog', children: [] },
            { url: '/contact', type: 'internal', label: 'Contact', children: [] },
          ],
          footer: [
            { url: '/', type: 'internal', label: 'Home', children: [] },
            { url: '/about', type: 'internal', label: 'About Us', children: [] },
            { url: '/services', type: 'internal', label: 'Services', children: [] },
            { url: '/blog', type: 'internal', label: 'Blog', children: [] },
            { url: '/contact', type: 'internal', label: 'Contact', children: [] },
            { url: '/legal/privacy', type: 'internal', label: 'Privacy Policy', children: [] },
          ]
        },
        header: {
          layout: 'logo-left',
          sticky: true,
          transparent: false,
          ctaText: 'Get Started',
          ctaLink: '/contact',
          logoType: 'text',
          logoText: 'Global Backend',
          logoWidth: 160,
          logoHeight: 28,
          menuType: 'main',
          mobileMenu: { layout: 'drawer', enabled: true, logoAlign: 'left' },
        },
        footer: {
          layout: '4-columns',
          columns: [
            { type: 'logo_desc', title: 'About', description: 'A powerful headless CMS platform.' },
            { type: 'links', title: 'Quick Links', sourceType: 'navigation', menuType: 'footer' },
            { type: 'contact', title: 'Contact', phone: '+1 (555) 000-0000', email: 'hello@example.com' },
            { type: 'social', title: 'Follow Us', items: [{ platform: 'facebook', url: '#' }] },
          ]
        },
        websiteSettings: { title: 'Global Backend', tagline: 'Headless CMS Platform', domain: '' },
      }
    });
    console.log('✅ Updated navigation + header + footer for default site');
  } else {
    console.log('Creating GlobalSettings for default site...');
    await prisma.globalSettings.create({
      data: {
        siteId: defaultSite.id,
        websiteSettings: { title: 'Global Backend', tagline: 'Headless CMS Platform', domain: '' },
        navigation: {
          main: [
            { url: '/', type: 'internal', label: 'Home', children: [] },
            { url: '/about', type: 'internal', label: 'About', children: [] },
            { url: '/services', type: 'internal', label: 'Services', children: [
              { url: '/services/web-dev', type: 'internal', label: 'Web Development' },
              { url: '/services/consulting', type: 'internal', label: 'Consulting' },
            ]},
            { url: '/blog', type: 'internal', label: 'Blog', children: [] },
            { url: '/contact', type: 'internal', label: 'Contact', children: [] },
          ],
          footer: [
            { url: '/', type: 'internal', label: 'Home' },
            { url: '/about', type: 'internal', label: 'About Us' },
            { url: '/services', type: 'internal', label: 'Services' },
            { url: '/blog', type: 'internal', label: 'Blog' },
            { url: '/contact', type: 'internal', label: 'Contact' },
            { url: '/legal/privacy', type: 'internal', label: 'Privacy Policy' },
          ]
        },
        header: {
          layout: 'logo-left',
          sticky: true,
          transparent: false,
          ctaText: 'Get Started',
          ctaLink: '/contact',
          logoType: 'text',
          logoText: 'Global Backend',
          logoWidth: 160,
          logoHeight: 28,
          menuType: 'main',
          mobileMenu: { layout: 'drawer', enabled: true, logoAlign: 'left' },
        },
        footer: {
          layout: '4-columns',
          columns: [
            { type: 'logo_desc', title: 'About', description: 'A powerful headless CMS platform.' },
            { type: 'links', title: 'Quick Links', sourceType: 'navigation', menuType: 'footer' },
            { type: 'contact', title: 'Contact', phone: '+1 (555) 000-0000', email: 'hello@example.com' },
            { type: 'social', title: 'Follow Us', items: [{ platform: 'facebook', url: '#' }] },
          ]
        },
      }
    });
    console.log('✅ Created GlobalSettings with navigation + header + footer for default site');
  }

  // Verify
  const check = await prisma.globalSettings.findUnique({ where: { siteId: defaultSite.id } });
  console.log('\nVerification:');
  console.log('  Has navigation:', check?.navigation ? 'YES (' + Object.keys(check.navigation).join(', ') + ')' : 'NO');
  console.log('  Has header:', check?.header ? 'YES' : 'NO');
  console.log('  Has footer:', check?.footer ? 'YES' : 'NO');

  await prisma.$disconnect();
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
