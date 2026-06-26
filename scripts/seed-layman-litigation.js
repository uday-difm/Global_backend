/**
 * Layman Litigation — Full CMS Seed Script
 *
 * Run: node scripts/seed-layman-litigation.js
 * This creates all content for the Layman Litigation blog/legal site.
 */
require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SITE_ID = "layman_litigation";

async function seed() {
  console.log("🌱 Seeding Layman Litigation CMS content...\n");

  // ── 1. Ensure site exists ──
  let site = await prisma.site.findUnique({ where: { id: SITE_ID } });
  if (!site) {
    site = await prisma.site.create({
      data: {
        id: SITE_ID,
        name: "Layman Litigation",
        isActive: true,
        domain: "localhost",
        integrationKey: `gkey_seed_${Date.now()}`,
      },
    });
    console.log("  ✅ Site created:", site.name);
  } else {
    console.log("  ✅ Site already exists:", site.name);
  }

  // ── 2. Ensure admin user ──
  let adminUser = await prisma.user.findFirst({
    where: { email: "admin@laymanlitigation.com" },
  });
  if (!adminUser) {
    const hash = await bcrypt.hash("Admin123!", 10);
    adminUser = await prisma.user.create({
      data: {
        email: "admin@laymanlitigation.com",
        passwordHash: hash,
        globalRole: "SUPERADMIN",
        isActive: true,
      },
    });
    console.log("  ✅ Admin user created:", adminUser.email);
    console.log("     Login: admin@laymanlitigation.com / Admin123!");
  } else {
    console.log("  ✅ Admin user exists:", adminUser.email);
  }

  // Ensure SiteUser relation
  const existingRel = await prisma.siteUser.findFirst({
    where: { siteId: SITE_ID, userId: adminUser.id },
  });
  if (!existingRel) {
    await prisma.siteUser.create({
      data: { siteId: SITE_ID, userId: adminUser.id, role: "ADMIN" },
    });
  }

  // ── 3. Global Settings ──
  await prisma.globalSettings.upsert({
    where: { siteId: SITE_ID },
    update: {
      websiteSettings: {
        title: "Layman Litigation",
        tagline: "Legal clarity for everyone",
        logoUrl:
          "https://res.cloudinary.com/dmryq9zly/image/upload/v1782468792/site-layman_litigation/wxkrj2ks5p3er4gi9n6c.jpg",
        favicon: "",
        brandColors: {
          primary: "#1e3a5f",
          secondary: "#c9a84c",
          accent: "#f0f4f8",
        },
        maintenanceMode: false,
      },
      analytics: {
        gaMeasurementId: "",
        gtmId: "",
        clarityId: "",
        metaPixelId: "",
        linkedinPartnerId: "",
        searchConsoleVerification: "",
      },
      contactDetails: {
        phone: "+1 (555) 123-4567",
        email: "contact@laymanlitigation.com",
        address: "123 Legal Avenue, Suite 400, New York, NY 10001",
        whatsapp: "+15551234567",
        googleMapsUrl: "https://maps.google.com/?q=123+Legal+Avenue+NY",
        businessHours: [
          { day: "Monday", open: "09:00", close: "18:00", closed: false },
          { day: "Tuesday", open: "09:00", close: "18:00", closed: false },
          { day: "Wednesday", open: "09:00", close: "18:00", closed: false },
          { day: "Thursday", open: "09:00", close: "18:00", closed: false },
          { day: "Friday", open: "09:00", close: "17:00", closed: false },
          { day: "Saturday", open: "", close: "", closed: true },
          { day: "Sunday", open: "", close: "", closed: true },
        ],
        socialLinks: {
          facebook: "https://facebook.com/laymanlitigation",
          instagram: "https://instagram.com/laymanlitigation",
          linkedin: "https://linkedin.com/company/laymanlitigation",
          twitter: "https://twitter.com/laymanlegal",
          youtube: "https://youtube.com/@laymanlitigation",
          tiktok: "https://tiktok.com/@laymanlitigation",
        },
        mapCoordinates: { lat: 40.7128, lng: -74.006 },
      },
      emailSettings: {
        provider: "smtp",
        host: "",
        port: "587",
        username: "",
        password: "",
        formEmail: "noreply@laymanlitigation.com",
        autoReplyTemplate: {
          enabled: true,
          subject: "Thank you for contacting Layman Litigation, {name}!",
          body: "Hi {name},\n\nThank you for reaching out to Layman Litigation. We have received your inquiry and one of our legal representatives will get back to you within 24 hours.\n\nBest regards,\nThe {siteName} Team",
        },
        adminAlerts: {
          enabled: true,
          email: "admin@laymanlitigation.com",
        },
        failedLogs: [],
      },
      ctaConfig: {
        popups: [
          {
            id: "popup-1",
            enabled: true,
            type: "subscription",
            title: "Stay Informed",
            body: "Subscribe to our legal newsletter for the latest updates on laws and regulations that matter to you.",
            buttonText: "Subscribe Now",
            buttonLink: "/newsletter",
            trigger: "delay",
            triggerValue: 5,
            showOnce: true,
          },
        ],
        floatingButtons: [
          {
            id: "fb-1",
            enabled: true,
            icon: "phone",
            label: "Call Us",
            link: "tel:+15551234567",
            position: "bottom-right",
            color: "#1e3a5f",
          },
          {
            id: "fb-2",
            enabled: true,
            icon: "message-circle",
            label: "Free Consultation",
            link: "/contact",
            position: "bottom-right",
            color: "#c9a84c",
          },
        ],
      },
      securityControls: {
        inputValidation: true,
        rateLimitRps: 60,
        sessionTimeout: 60,
        recaptchaSiteKey: "",
        recaptchaSecretKey: "",
        spamFilterEnabled: true,
        spamKeywords: ["spam", "casino", "viagra", "crypto", "free money"],
      },
      compliance: {
        cookieConsentEnabled: true,
        cookieConsentMessage:
          "This site uses cookies to enhance your experience. By continuing to browse, you agree to our use of cookies.",
        essentialCookiesEnabled: true,
        analyticsCookiesEnabled: true,
        marketingCookiesEnabled: false,
        formConsentEnabled: true,
        formConsentMessage:
          "I consent to having this website store my submitted information so they can respond to my inquiry.",
        privacyAcceptanceEnabled: true,
        marketingConsentEnabled: false,
      },
    },
    create: {
      siteId: SITE_ID,
      websiteSettings: {},
      emailSettings: {},
      ctaConfig: {},
      securityControls: {},
      compliance: {},
    },
  });
  console.log("  ✅ Global settings configured");

  // ── 4. Navigation ──
  const mainNavItems = [
    { url: "/", type: "internal", label: "Home", children: [] },
    { url: "/about", type: "internal", label: "About", children: [] },
    {
      url: "/practice-areas",
      type: "internal",
      label: "Practice Areas",
      children: [
        {
          url: "/practice-areas/civil-litigation",
          type: "internal",
          label: "Civil Litigation",
        },
        {
          url: "/practice-areas/criminal-defense",
          type: "internal",
          label: "Criminal Defense",
        },
        {
          url: "/practice-areas/family-law",
          type: "internal",
          label: "Family Law",
        },
        {
          url: "/practice-areas/business-law",
          type: "internal",
          label: "Business Law",
        },
        {
          url: "/practice-areas/real-estate-law",
          type: "internal",
          label: "Real Estate Law",
        },
      ],
    },
    { url: "/blogs", type: "internal", label: "Blog", children: [] },
    { url: "/faq", type: "internal", label: "FAQs", children: [] },
    { url: "/contact", type: "internal", label: "Contact", children: [] },
  ];

  const footerNavItems = [
    { url: "/", type: "internal", label: "Home", children: [] },
    { url: "/about", type: "internal", label: "About Us", children: [] },
    { url: "/blogs", type: "internal", label: "Blog", children: [] },
    {
      url: "/practice-areas",
      type: "internal",
      label: "Practice Areas",
      children: [],
    },
    { url: "/faq", type: "internal", label: "FAQs", children: [] },
    {
      url: "/legal/privacy",
      type: "internal",
      label: "Privacy Policy",
      children: [],
    },
    {
      url: "/legal/terms",
      type: "internal",
      label: "Terms of Service",
      children: [],
    },
    { url: "/contact", type: "internal", label: "Contact Us", children: [] },
  ];

  await prisma.globalSettings.update({
    where: { siteId: SITE_ID },
    data: {
      navigation: {
        main: mainNavItems,
        footer: footerNavItems,
      },
    },
  });
  console.log("  ✅ Navigation configured");

  // ── 5. Header Settings ──
  await prisma.globalSettings.update({
    where: { siteId: SITE_ID },
    data: {
      header: {
        layout: "logo-left",
        sticky: true,
        transparent: false,
        ctaText: "Free Consultation",
        ctaLink: "/contact",
        logoType: "text",
        logoText: "Layman Litigation",
        logoWidth: 180,
        logoHeight: 28,
        menuType: "main",
        mobileMenu: { layout: "drawer", enabled: true, logoAlign: "left" },
        announcementBar: {
          enabled: true,
          text: "Free initial consultation — Call us today at (555) 123-4567",
          link: "tel:+15551234567",
          bgColor: "#1e3a5f",
          textColor: "#ffffff",
        },
      },
    },
  });
  console.log("  ✅ Header configured");

  // ── 6. Footer Settings ──
  await prisma.globalSettings.update({
    where: { siteId: SITE_ID },
    data: {
      footer: {
        layout: "4-columns",
        columns: [
          {
            type: "logo_desc",
            title: "About Us",
            logoUrl: "",
            description:
              "Layman Litigation is dedicated to making the law accessible and understandable for everyone. Our team of experienced attorneys provides clear, practical legal guidance.",
          },
          {
            type: "links",
            title: "Quick Links",
            items: [
              { url: "/about", label: "About Us" },
              { url: "/practice-areas", label: "Practice Areas" },
              { url: "/blogs", label: "Legal Blog" },
              { url: "/faq", label: "FAQs" },
              { url: "/contact", label: "Contact" },
            ],
          },
          {
            type: "contact",
            title: "Contact Info",
            phone: "+1 (555) 123-4567",
            email: "contact@laymanlitigation.com",
            address: "123 Legal Avenue, Suite 400\nNew York, NY 10001",
          },
          {
            type: "social",
            title: "Follow Us",
            items: [
              {
                platform: "facebook",
                url: "https://facebook.com/laymanlitigation",
              },
              {
                platform: "instagram",
                url: "https://instagram.com/laymanlitigation",
              },
              {
                platform: "linkedin",
                url: "https://linkedin.com/company/laymanlitigation",
              },
              { platform: "twitter", url: "https://twitter.com/laymanlegal" },
              {
                platform: "youtube",
                url: "https://youtube.com/@laymanlitigation",
              },
            ],
          },
        ],
        newsletterEnabled: true,
        copyright: "© {year} Layman Litigation. All rights reserved.",
      },
    },
  });
  console.log("  ✅ Footer configured");

  // ── 7. Create Categories ──
  const categories = [
    { name: "Civil Litigation", slug: "civil-litigation" },
    { name: "Criminal Law", slug: "criminal-law" },
    { name: "Family Law", slug: "family-law" },
    { name: "Business Law", slug: "business-law" },
    { name: "Real Estate", slug: "real-estate" },
    { name: "Legal News", slug: "legal-news" },
    { name: "Legal Guides", slug: "legal-guides" },
  ];

  const createdCategories = [];
  for (const cat of categories) {
    const existing = await prisma.category.findUnique({
      where: { slug: cat.slug },
    });
    if (existing) {
      createdCategories.push(existing);
    } else {
      const created = await prisma.category.create({ data: cat });
      createdCategories.push(created);
    }
  }
  console.log(`  ✅ ${createdCategories.length} categories created`);

  // ── 8. Create Blog Posts ──
  const posts = [
    {
      title: "Understanding Your Rights During a Police Stop",
      slug: "understanding-rights-during-police-stop",
      excerpt:
        "Know what to do and what your rights are when stopped by law enforcement. This guide covers the essentials every citizen should know.",
      content: `<h2>Know Your Rights</h2>
<p>Being stopped by the police can be an intimidating experience. Understanding your constitutional rights is crucial to protecting yourself while cooperating within legal boundaries.</p>
<h3>The Right to Remain Silent</h3>
<p>The Fifth Amendment protects your right to remain silent. You are not legally obligated to answer questions beyond providing your identification in certain circumstances. Clearly and calmly state, "I am exercising my right to remain silent."</p>
<h3>Search and Seizure</h3>
<p>The Fourth Amendment protects against unreasonable searches. Unless the officer has a warrant or probable cause, you have the right to refuse a search of your person or vehicle. Say clearly, "I do not consent to a search."</p>
<h3>When You Are in a Vehicle</h3>
<p>If you are pulled over while driving, you must provide your license, registration, and proof of insurance. Keep your hands visible on the steering wheel and inform the officer before reaching for anything.</p>
<h3>Documentation Is Key</h3>
<p>If you believe your rights have been violated, document everything. Write down the officer's name and badge number, the date and time, and any witnesses present. Contact a civil rights attorney as soon as possible.</p>`,
      status: "PUBLISHED",
      categorySlugs: ["civil-litigation", "legal-guides"],
      seoTitle: "Know Your Rights During a Police Stop | Layman Litigation",
      seoDescription:
        "Learn your constitutional rights during a police stop. Essential guide covering Fifth Amendment, search and seizure, and what to do when pulled over.",
    },
    {
      title: "What to Look for in a Personal Injury Settlement",
      slug: "personal-injury-settlement-guide",
      excerpt:
        "Navigating a personal injury claim can be overwhelming. Here's what you need to know about evaluating settlement offers and working with your attorney.",
      content: `<h2>Understanding Personal Injury Settlements</h2>
<p>If you've been injured due to someone else's negligence, you may be entitled to compensation. Understanding how settlement amounts are calculated can help you make informed decisions.</p>
<h3>Types of Damages</h3>
<p>Compensatory damages cover both economic losses (medical bills, lost wages, property damage) and non-economic losses (pain and suffering, emotional distress). Punitive damages may be awarded in cases of gross negligence.</p>
<h3>Factors That Affect Settlement Value</h3>
<ul>
<li>Severity and permanence of injuries</li>
<li>Medical treatment costs and prognosis</li>
<li>Impact on quality of life and earning capacity</li>
<li>Strength of liability evidence</li>
<li>Insurance policy limits</li>
</ul>
<h3>When to Accept a Settlement</h3>
<p>Insurance companies often make early low-ball offers. Consult with your attorney before accepting any settlement. Once you accept, you generally cannot pursue additional compensation later.</p>
<h3>The Role of Your Attorney</h3>
<p>An experienced personal injury attorney will negotiate on your behalf, handle all communication with insurance companies, and ensure you receive fair compensation. Most work on a contingency fee basis.</p>`,
      status: "PUBLISHED",
      categorySlugs: ["civil-litigation", "legal-guides"],
      seoTitle: "Personal Injury Settlement Guide | Layman Litigation",
      seoDescription:
        "Learn how personal injury settlements work, what factors affect your claim value, and when to accept a settlement offer. Expert guidance from Layman Litigation.",
    },
    {
      title: "The Difference Between Misdemeanor and Felony Charges",
      slug: "misdemeanor-vs-felony-charges",
      excerpt:
        "Understanding the distinction between misdemeanor and felony charges is crucial. This guide explains the legal classifications, penalties, and long-term consequences.",
      content: `<h2>Misdemeanor vs. Felony: Key Differences</h2>
<p>Criminal charges in the United States are broadly classified into two categories: misdemeanors and felonies. The classification determines the potential penalties and long-term consequences.</p>
<h3>What Is a Misdemeanor?</h3>
<p>Misdemeanors are less serious criminal offenses typically punishable by fines, probation, or jail time of less than one year. Examples include petty theft, simple assault, disorderly conduct, and first-time DUI offenses.</p>
<h3>What Is a Felony?</h3>
<p>Felonies are serious crimes punishable by imprisonment for more than one year. Examples include murder, rape, armed robbery, fraud, and drug trafficking. Felony convictions carry significant collateral consequences.</p>
<h3>Collateral Consequences</h3>
<p>Beyond incarceration, a criminal record can affect employment opportunities, housing applications, professional licenses, voting rights, and firearm ownership. Felony convictions have more severe and lasting collateral consequences than misdemeanors.</p>
<h3>Wobblers</h3>
<p>Some offenses are "wobbler" crimes that can be charged as either a misdemeanor or felony depending on the circumstances and the defendant's criminal history. A skilled criminal defense attorney can often negotiate for misdemeanor treatment.</p>`,
      status: "PUBLISHED",
      categorySlugs: ["criminal-law"],
      seoTitle: "Misdemeanor vs Felony Charges | Layman Litigation",
      seoDescription:
        "Understand the difference between misdemeanor and felony charges, potential penalties, and long-term consequences. Expert criminal law guidance.",
    },
    {
      title: "Child Custody Laws: A Guide for Parents",
      slug: "child-custody-laws-guide",
      excerpt:
        "Navigating child custody laws can be emotionally challenging. This guide explains the different types of custody, how courts make decisions, and what parents should know.",
      content: `<h2>Understanding Child Custody</h2>
<p>Child custody is one of the most emotionally charged aspects of divorce or separation. Understanding how courts make custody decisions can help parents navigate this process more effectively.</p>
<h3>Types of Custody</h3>
<p>Legal custody refers to the right to make important decisions about a child's life (education, healthcare, religion). Physical custody refers to where the child lives. Both can be sole or joint.</p>
<h3>The Best Interest of the Child Standard</h3>
<p>Courts make custody decisions based on what serves the child's best interests. Factors include: the child's emotional bond with each parent, each parent's ability to provide stability, the child's wishes (if old enough), and any history of abuse or neglect.</p>
<h3>Custody Arrangements</h3>
<ul>
<li>Sole custody — One parent has primary physical and/or legal custody</li>
<li>Joint custody — Both parents share physical and/or legal custody</li>
<li>Bird's nest custody — The child stays in the family home while parents rotate</li>
<li>Split custody — Siblings are divided between parents (rare)</li>
</ul>
<h3>Modifying Custody Orders</h3>
<p>Custody orders can be modified if there has been a significant change in circumstances, such as a parent's relocation, change in employment, or concerns about the child's safety.</p>`,
      status: "PUBLISHED",
      categorySlugs: ["family-law"],
      seoTitle: "Child Custody Laws Guide | Layman Litigation",
      seoDescription:
        "Comprehensive guide to child custody laws including types of custody, how courts make decisions, and how to modify custody orders.",
    },
    {
      title: "Starting a Business: Legal Structure Options Explained",
      slug: "business-legal-structures-explained",
      excerpt:
        "Choosing the right legal structure for your business is one of the most important decisions you'll make. Compare LLCs, corporations, partnerships, and sole proprietorships.",
      content: `<h2>Choosing Your Business Structure</h2>
<p>One of the first and most important decisions you'll make when starting a business is choosing the right legal structure. Each option has distinct implications for liability, taxation, and management.</p>
<h3>Sole Proprietorship</h3>
<p>The simplest structure — you and your business are legally the same entity. Easy to set up with minimal paperwork, but you have unlimited personal liability for business debts and obligations.</p>
<h3>Partnership</h3>
<p>Two or more people share ownership. General partnerships offer flexibility but expose each partner to unlimited liability. Limited partnerships and LLCs can provide liability protection for certain partners.</p>
<h3>Limited Liability Company (LLC)</h3>
<p>Combines the liability protection of a corporation with the tax flexibility of a partnership. LLCs are popular among small business owners for their simplicity and protection of personal assets.</p>
<h3>Corporation (C-Corp and S-Corp)</h3>
<p>Corporations provide the strongest liability protection but involve more complex compliance requirements. C-Corps face double taxation, while S-Corps allow income to pass through to shareholders' personal tax returns.</p>
<h3>Choosing What's Right for You</h3>
<p>Consider factors like liability exposure, tax implications, management structure, funding needs, and future growth plans. Consult with a business attorney to determine the best structure for your specific situation.</p>`,
      status: "PUBLISHED",
      categorySlugs: ["business-law", "legal-guides"],
      seoTitle: "Business Legal Structures Explained | Layman Litigation",
      seoDescription:
        "Compare LLC, corporation, partnership, and sole proprietorship. Learn which business structure is right for your needs with expert legal guidance.",
    },
    {
      title: "What Homebuyers Need to Know About Property Title Searches",
      slug: "property-title-search-guide",
      excerpt:
        "A title search is a critical step in the homebuying process. Learn what it involves, why it matters, and how it protects your investment.",
      content: `<h2>Why Title Searches Matter</h2>
<p>When purchasing real estate, a title search is essential to verify that the seller has legal ownership and the right to transfer the property. This process uncovers potential issues that could affect your ownership rights.</p>
<h3>What a Title Search Reveals</h3>
<ul>
<li>Current ownership and chain of title</li>
<li>Outstanding mortgages and liens</li>
<li>Easements and right-of-way agreements</li>
<li>Restrictive covenants and CC&Rs</li>
<li>Tax delinquencies</li>
<li>Judgments against the property</li>
</ul>
<h3>Title Insurance</h3>
<p>Lenders require title insurance to protect their investment, and owner's title insurance protects your equity. It covers legal fees if someone challenges your ownership and pays valid claims against the title.</p>
<h3>Common Title Issues</h3>
<p>Problems discovered during a title search can delay or derail a sale. Common issues include undisclosed heirs claiming ownership, forged documents in the chain of title, and errors in public records.</p>
<h3>Working With a Real Estate Attorney</h3>
<p>A real estate attorney can review title search results, resolve any issues that arise, and ensure the closing process goes smoothly. They represent your interests throughout the transaction.</p>`,
      status: "PUBLISHED",
      categorySlugs: ["real-estate", "legal-guides"],
      seoTitle:
        "Property Title Search Guide for Homebuyers | Layman Litigation",
      seoDescription:
        "Learn why title searches matter in real estate transactions, what they reveal, and how title insurance protects your investment.",
    },
    {
      title: "New Employment Laws Taking Effect This Year",
      slug: "new-employment-laws-2026",
      excerpt:
        "Stay informed about the latest changes in employment law that affect both employers and employees. Key updates on minimum wage, paid leave, and worker classification.",
      content: `<h2>Employment Law Updates</h2>
<p>This year brings significant changes to employment laws across the country. Both employers and employees should be aware of these updates to ensure compliance and protect their rights.</p>
<h3>Minimum Wage Increases</h3>
<p>Several states have implemented minimum wage increases tied to cost-of-living adjustments. Check your state's current minimum wage and ensure your payroll practices are up to date.</p>
<h3>Paid Family and Medical Leave</h3>
<p>More states are joining the trend of mandated paid family and medical leave programs. These programs provide partial wage replacement for employees dealing with serious health conditions, caring for family members, or bonding with a new child.</p>
<h3>Worker Classification</h3>
<p>The debate over employee versus independent contractor classification continues to evolve. New regulations in several states tighten the criteria for classifying workers as independent contractors, with significant implications for gig economy companies and their workers.</p>
<h3>Non-Compete Agreements</h3>
<p>The Federal Trade Commission's restrictions on non-compete agreements are reshaping employment contracts. Many states have also passed their own limitations on the enforceability of non-compete clauses, particularly for low-wage workers.</p>`,
      status: "PUBLISHED",
      categorySlugs: ["legal-news", "business-law"],
      seoTitle: "New Employment Laws 2026 | Layman Litigation",
      seoDescription:
        "Stay informed about the latest employment law changes affecting minimum wage, paid leave, worker classification, and non-compete agreements.",
    },
    {
      title: "Understanding the Civil Litigation Process Step by Step",
      slug: "civil-litigation-process-step-by-step",
      excerpt:
        "From filing a complaint to appeal, this comprehensive guide walks through each stage of the civil litigation process in plain language.",
      content: `<h2>Civil Litigation: A Step-by-Step Guide</h2>
<p>Civil litigation is the process of resolving disputes between individuals, businesses, or organizations through the court system. While every case is unique, most follow a similar progression.</p>
<h3>Step 1: Pleadings</h3>
<p>The plaintiff files a complaint outlining their claims and the relief sought. The defendant responds with an answer, admitting or denying the allegations and raising any affirmative defenses. Motions to dismiss may be filed at this stage.</p>
<h3>Step 2: Discovery</h3>
<p>Both parties exchange information relevant to the case through interrogatories (written questions), depositions (oral testimony under oath), requests for production of documents, and requests for admission. This is often the most time-consuming phase.</p>
<h3>Step 3: Pre-Trial Motions</h3>
<p>Parties may file motions for summary judgment, asking the court to rule on certain claims or defenses without a trial. If the court finds no genuine dispute of material fact, it may decide the case in favor of one party.</p>
<h3>Step 4: Trial</h3>
<p>If the case is not resolved through settlement or summary judgment, it proceeds to trial. The parties present evidence and arguments to a judge or jury, who renders a verdict.</p>
<h3>Step 5: Appeal</h3>
<p>The losing party may appeal the verdict to a higher court, arguing that legal errors affected the outcome. Appeals focus on legal questions, not factual disputes.</p>`,
      status: "PUBLISHED",
      categorySlugs: ["civil-litigation", "legal-guides"],
      seoTitle: "Civil Litigation Process Guide | Layman Litigation",
      seoDescription:
        "Comprehensive step-by-step guide to the civil litigation process from filing a complaint through appeal. Understand each stage in plain language.",
    },
    {
      title: "Estate Planning 101: Why Everyone Needs a Will",
      slug: "estate-planning-101-will-guide",
      excerpt:
        "Estate planning isn't just for the wealthy. Learn why everyone should have a will, what happens without one, and how to get started.",
      content: `<h2>Why Estate Planning Matters</h2>
<p>Many people put off estate planning, thinking it's only for the wealthy or elderly. In reality, everyone can benefit from having basic estate planning documents in place.</p>
<h3>What Happens Without a Will?</h3>
<p>If you die without a will (intestate), state law determines who inherits your property. This may not align with your wishes, and the process can be slower and more expensive for your loved ones.</p>
<h3>Key Estate Planning Documents</h3>
<ul>
<li>Last Will and Testament — Specifies how your assets are distributed</li>
<li>Living Trust — Avoids probate and provides more control over distribution</li>
<li>Power of Attorney — Authorizes someone to manage your financial affairs</li>
<li>Healthcare Proxy — Designates someone to make medical decisions</li>
<li>Living Will — States your wishes for end-of-life care</li>
</ul>
<h3>Updating Your Estate Plan</h3>
<p>Life changes such as marriage, divorce, the birth of children, or significant changes in assets should prompt a review of your estate plan. Review your documents every three to five years.</p>`,
      status: "PUBLISHED",
      categorySlugs: ["legal-guides", "civil-litigation"],
      seoTitle: "Estate Planning 101: Will Guide | Layman Litigation",
      seoDescription:
        "Learn why everyone needs a will, what happens without one, and the essential estate planning documents you should have in place.",
    },
  ];

  const createdPosts = [];
  for (const post of posts) {
    const existing = await prisma.post.findFirst({
      where: { siteId: SITE_ID, slug: post.slug },
    });
    if (!existing) {
      const categoryIds = createdCategories
        .filter((c) => post.categorySlugs.includes(c.slug))
        .map((c) => c.id);

      const created = await prisma.post.create({
        data: {
          siteId: SITE_ID,
          title: post.title,
          slug: post.slug,
          content: post.content,
          excerpt: post.excerpt,
          status: post.status,
          authorId: adminUser.id,
          featuredImageId: null,
          seoTitle: post.seoTitle,
          seoDescription: post.seoDescription,
          publishedAt: new Date(),
          categories: {
            connect: categoryIds.map((id) => ({ id })),
          },
        },
      });
      createdPosts.push(created);
      console.log(`  📝 Created post: ${post.title}`);
    } else {
      createdPosts.push(existing);
      console.log(`  📝 Post exists: ${post.title}`);
    }
  }

  // ── 9. Create Pages ──
  const homeSections = [
    {
      type: "hero",
      name: "Main Hero",
      order: 0,
      content: {
        title: "Legal Clarity for Everyone",
        subtitle:
          "Expert legal guidance explained in plain language. Whether you're facing a legal challenge or planning for the future, we're here to help.",
        primaryButton: {
          text: "Free Consultation",
          url: "/contact"
        },
        secondaryButton: {
          text: "Learn More",
          url: "/about"
        },
        backgroundUrl:
          "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1600",
        overlay: true,
        alignment: "left",
        textColor: "#ffffff",
      },
    },
    {
      type: "text_block",
      name: "About Section",
      order: 1,
      content: {
        heading: "Who We Are",
        body: "<p>Layman Litigation was founded with a simple mission: make the law accessible and understandable for everyone. Our team of experienced attorneys brings decades of combined experience across civil litigation, criminal defense, family law, business law, and real estate law.</p><p>We believe that legal representation should be transparent, communicative, and results-driven. Every client receives personalized attention and clear explanations at every stage of their case.</p>",
        layout: "left",
        showImage: true,
        imageUrl:
          "https://images.unsplash.com/photo-1589391886645-d51941baf7fb?w=800",
        imageAlt: "Layman Litigation team office",
        bgColor: "#ffffff",
        textColor: "#1e3a5f",
      },
    },
    {
      type: "services",
      name: "Practice Areas",
      order: 2,
      content: {
        heading: "Our Practice Areas",
        subheading: "Comprehensive legal services tailored to your needs",
        bgColor: "#f0f4f8",
        services: [
          {
            title: "Civil Litigation",
            description:
              "Representation in contract disputes, personal injury claims, property disputes, and more.",
            icon: "scale",
            link: "/practice-areas/civil-litigation",
          },
          {
            title: "Criminal Defense",
            description:
              "Aggressive defense for misdemeanor and felony charges. Protecting your rights and freedom.",
            icon: "shield",
            link: "/practice-areas/criminal-defense",
          },
          {
            title: "Family Law",
            description:
              "Divorce, child custody, child support, adoption, and domestic violence matters.",
            icon: "heart",
            link: "/practice-areas/family-law",
          },
          {
            title: "Business Law",
            description:
              "Business formation, contracts, mergers, intellectual property, and employment law.",
            icon: "briefcase",
            link: "/practice-areas/business-law",
          },
          {
            title: "Real Estate Law",
            description:
              "Property transactions, title searches, landlord-tenant disputes, and zoning issues.",
            icon: "home",
            link: "/practice-areas/real-estate-law",
          },
          {
            title: "Estate Planning",
            description:
              "Wills, trusts, powers of attorney, and probate administration services.",
            icon: "file-text",
            link: "/estate-planning",
          },
        ],
      },
    },
    {
      type: "testimonials",
      name: "Client Testimonials",
      order: 3,
      content: {
        heading: "What Our Clients Say",
        subheading: "Hear from the clients we've helped",
        bgColor: "#1e3a5f",
        textColor: "#ffffff",
      },
    },
    {
      type: "team",
      name: "Our Team",
      order: 4,
      content: {
        heading: "Meet Our Attorneys",
        subheading: "Experienced legal professionals dedicated to your success",
        bgColor: "#ffffff",
        textColor: "#1e3a5f",
      },
    },
    {
      type: "faq",
      name: "FAQ Section",
      order: 5,
      content: {
        heading: "Frequently Asked Questions",
        subheading: "Answers to common legal questions",
        bgColor: "#f0f4f8",
      },
    },
    {
      type: "text_block",
      name: "Why Choose Us",
      order: 6,
      content: {
        heading: "Why Choose Layman Litigation?",
        body: "<ul><li><strong>Plain Language</strong> — No legal jargon. We explain everything in terms you can understand.</li><li><strong>Proven Results</strong> — Track record of successful outcomes across all practice areas.</li><li><strong>Personal Attention</strong> — Your case is handled by experienced attorneys, not paralegals.</li><li><strong>Transparent Fees</strong> — Clear, upfront pricing with no hidden costs.</li><li><strong>Free Consultation</strong> — Discuss your case with an attorney at no cost.</li></ul>",
        layout: "center",
        showImage: false,
        bgColor: "#ffffff",
        textColor: "#1e3a5f",
      },
    },
    {
      type: "blogs",
      name: "Latest from Our Blog",
      order: 7,
      content: {
        heading: "Latest Legal Insights",
        subheading: "Stay informed with articles written by our attorneys",
        bgColor: "#f0f4f8",
        maxPosts: 3,
      },
    },
    {
      type: "cta",
      name: "Call to Action",
      order: 8,
      content: {
        heading: "Ready to Get Started?",
        subheading:
          "Schedule your free consultation today and let us help you navigate your legal matter.",
        ctaText: "Contact Us",
        ctaLink: "/contact",
        bgColor: "#1e3a5f",
        textColor: "#ffffff",
      },
    },
  ];

  // Create or update the home page
  let homePage = await prisma.page.findFirst({
    where: { siteId: SITE_ID, slug: "home" },
    include: { sections: true },
  });

  if (!homePage) {
    homePage = await prisma.page.create({
      data: {
        siteId: SITE_ID,
        title: "Home",
        slug: ""
        status: "PUBLISHED",
        isManagedBySync: false,
        isHardcoded: true,
        sourceRoute: "/",
        seoTitle: "Layman Litigation — Legal Clarity for Everyone",
        seoDescription:
          "Expert legal guidance explained in plain language. Civil litigation, criminal defense, family law, business law, and real estate law. Free consultation.",
      },
    });
  }

  // Delete existing sections and recreate
  await prisma.section.deleteMany({ where: { pageId: homePage.id } });

  for (const section of homeSections) {
    await prisma.section.create({
      data: {
        pageId: homePage.id,
        type: section.type,
        name: section.name,
        order: section.order,
        isVisible: true,
        content: section.content,
      },
    });
  }
  console.log("  ✅ Home page created with 9 sections");

  // ── Create About page ──
  let aboutPage = await prisma.page.findFirst({
    where: { siteId: SITE_ID, slug: "about" },
  });
  if (!aboutPage) {
    aboutPage = await prisma.page.create({
      data: {
        siteId: SITE_ID,
        title: "About Us",
        slug: "about",
        status: "PUBLISHED",
        isManagedBySync: false,
        sourceRoute: "/about",
        seoTitle: "About Layman Litigation | Experienced Legal Team",
        seoDescription:
          "Learn about Layman Litigation's mission, values, and experienced team of attorneys dedicated to making the law accessible for everyone.",
        sections: {
          create: [
            {
              type: "hero",
              name: "About Hero",
              order: 0,
              content: {
                heading: "About Layman Litigation",
                subheading:
                  "Making the law accessible, understandable, and effective for everyone.",
                alignment: "center",
                backgroundImage:
                  "https://images.unsplash.com/photo-1505663912509-0bf20c3b6b01?w=1600",
                overlay: true,
                textColor: "#ffffff",
              },
            },
            {
              type: "text_block",
              name: "Our Story",
              order: 1,
              content: {
                heading: "Our Story",
                body: "<p>Layman Litigation was born from a simple observation: the law is too important to be understood only by lawyers. Founded in 2015 by Sarah Mitchell and James Chen, our firm set out to change how legal services are delivered and communicated.</p><p>What started as a small practice in downtown New York has grown into a full-service law firm with over 20 attorneys covering five major practice areas. But we've never lost sight of our founding principle: every client deserves clear, honest communication about their legal matter.</p><p>Our attorneys are not just skilled litigators — they're educators who take the time to ensure you understand your options, your rights, and the process ahead.</p>",
                layout: "left",
                showImage: true,
                imageUrl:
                  "https://images.unsplash.com/photo-1577415124269-fc1140a69e91?w=800",
                bgColor: "#ffffff",
                textColor: "#1e3a5f",
              },
            },
            {
              type: "text_block",
              name: "Our Mission",
              order: 2,
              content: {
                heading: "Our Mission & Values",
                body: "<h3>Accessibility</h3><p>We break down complex legal concepts into plain language so you can make informed decisions about your case.</p><h3>Integrity</h3><p>We provide honest assessments of your case — even when the news isn't what you want to hear. We never overpromise.</p><h3>Results</h3><p>Our track record speaks for itself. We've recovered millions in settlements and won countless trials across all practice areas.</p><h3>Community</h3><p>We believe in giving back. Our attorneys volunteer at legal aid clinics and provide pro bono services to those who cannot afford representation.</p>",
                layout: "center",
                showImage: false,
                bgColor: "#f0f4f8",
                textColor: "#1e3a5f",
              },
            },
            {
              type: "cta",
              name: "About CTA",
              order: 3,
              content: {
                heading: "Ready to Work With Us?",
                subheading: "Schedule a free consultation with our team today.",
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
    console.log("  ✅ About page created");
  } else {
    console.log("  ✅ About page already exists");
  }

  // ── Create Contact page ──
  let contactPage = await prisma.page.findFirst({
    where: { siteId: SITE_ID, slug: "contact" },
  });
  if (!contactPage) {
    await prisma.page.create({
      data: {
        siteId: SITE_ID,
        title: "Contact Us",
        slug: "contact",
        status: "PUBLISHED",
        isManagedBySync: false,
        sourceRoute: "/contact",
        seoTitle: "Contact Layman Litigation | Free Consultation",
        seoDescription:
          "Get in touch with Layman Litigation. Schedule a free consultation with our experienced legal team. Call (555) 123-4567 or email us.",
        sections: {
          create: [
            {
                      type: "hero",
                      name: "Contact Hero",
              order: 0,
              content: {
                heading: "Contact Us",
                subheading:
                  "We're here to help. Reach out for a free consultation.",
                alignment: "center",
                textColor: "#1e3a5f",
              },
            },
          ],
        },
      },
    });
    console.log("  ✅ Contact page created");
  } else {
    console.log("  ✅ Contact page already exists");
  }

  // ── Create FAQ page ──
  let faqPage = await prisma.page.findFirst({
    where: { siteId: SITE_ID, slug: "faqs" },
  });
  if (!faqPage) {
    await prisma.page.create({
      data: {
        siteId: SITE_ID,
        title: "Frequently Asked Questions",
        slug: "faqs",
        status: "PUBLISHED",
        isManagedBySync: false,
        sourceRoute: "/faq",
        seoTitle: "Frequently Asked Legal Questions | Layman Litigation",
        seoDescription:
          "Find answers to common legal questions about civil litigation, criminal defense, family law, business law, and more.",
        sections: {
          create: [
            {
                      type: "hero",
                      name: "FAQ Hero",
              order: 0,
              content: {
                heading: "Frequently Asked Questions",
                subheading:
                  "Answers to common legal questions in plain language.",
                alignment: "center",
                textColor: "#1e3a5f",
              },
            },
            {
                      type: "faq",
                      name: "FAQ List",
              order: 1,
              content: {
                heading: "Common Legal Questions",
                bgColor: "#ffffff",
              },
            },
          ],
        },
      },
    });
    console.log("  ✅ FAQ page created");
  } else {
    console.log("  ✅ FAQ page already exists");
  }

  // ── 10. Create Team Members ──
  const teamMembers = [
    {
      name: "Sarah Mitchell",
      role: "Founding Partner — Civil Litigation",
      bio: "Sarah Mitchell founded Layman Litigation in 2015 with a vision of making legal services accessible to all. With over 20 years of experience in civil litigation, she has successfully represented clients in complex contract disputes, personal injury cases, and class action lawsuits. Sarah is admitted to the New York State Bar and the Federal District Courts.",
      sortOrder: 0,
      socialLinks: {
        linkedin: "https://linkedin.com/in/sarahmitchell",
        twitter: "https://twitter.com/sarahmitchell",
      },
    },
    {
      name: "James Chen",
      role: "Founding Partner — Criminal Defense",
      bio: "James Chen brings 18 years of criminal defense experience to Layman Litigation. A former public defender, James has handled thousands of cases ranging from misdemeanors to serious felonies. He is known for his aggressive advocacy and meticulous trial preparation. Admitted to the New York State Bar and Federal Courts.",
      sortOrder: 1,
      socialLinks: {
        linkedin: "https://linkedin.com/in/jameschen",
        twitter: "https://twitter.com/jameschen",
      },
    },
    {
      name: "Maria Rodriguez",
      role: "Partner — Family Law",
      bio: "Maria Rodriguez specializes in family law, including divorce, child custody, and adoption. Her compassionate approach helps clients navigate emotionally challenging situations while protecting their legal rights. Maria is a certified mediator and frequently speaks at family law conferences.",
      sortOrder: 2,
      socialLinks: {
        linkedin: "https://linkedin.com/in/mariarodriguez",
      },
    },
    {
      name: "David Park",
      role: "Partner — Business Law",
      bio: "David Park leads our Business Law practice, advising startups and established companies on corporate governance, contracts, mergers and acquisitions, and intellectual property. Before joining Layman Litigation, David practiced at a top-tier corporate law firm in Manhattan.",
      sortOrder: 3,
      socialLinks: {
        linkedin: "https://linkedin.com/in/davidpark",
      },
    },
    {
      name: "Emily Thompson",
      role: "Senior Associate — Real Estate Law",
      bio: "Emily Thompson handles all aspects of real estate law, including residential and commercial transactions, title searches, landlord-tenant disputes, and zoning matters. She is known for her meticulous attention to detail and ability to close even the most complex transactions smoothly.",
      sortOrder: 4,
      socialLinks: {
        linkedin: "https://linkedin.com/in/emilythompson",
      },
    },
  ];

  for (const member of teamMembers) {
    const existing = await prisma.teamMember.findFirst({
      where: { siteId: SITE_ID, name: member.name },
    });
    if (!existing) {
      await prisma.teamMember.create({
        data: {
          siteId: SITE_ID,
          name: member.name,
          role: member.role,
          bio: member.bio,
          sortOrder: member.sortOrder,
          socialLinks: member.socialLinks,
        },
      });
      console.log(`  👤 Team member created: ${member.name}`);
    }
  }

  // ── 11. Create Testimonials ──
  const testimonials = [
    {
      clientName: "Robert Johnson",
      rating: 5,
      content:
        "Sarah Mitchell handled my personal injury case with exceptional professionalism. She explained every step clearly and secured a settlement far beyond what I expected. I couldn't have asked for better representation.",
      sortOrder: 0,
    },
    {
      clientName: "Patricia Williams",
      rating: 5,
      content:
        "James Chen defended me in a complex criminal case and the outcome was better than I ever hoped for. His knowledge of the law and courtroom presence is outstanding. He truly cares about his clients.",
      sortOrder: 1,
    },
    {
      clientName: "Michael Brown",
      rating: 5,
      content:
        "Going through a divorce was the hardest thing I've ever done, but Maria Rodriguez made the legal process manageable. She was compassionate when I needed it and tough when it mattered. Highly recommend.",
      sortOrder: 2,
    },
    {
      clientName: "Lisa Garcia",
      rating: 4,
      content:
        "David Park helped me structure my startup from the ground up. His advice on entity selection, founder agreements, and intellectual property protection was invaluable. A true expert in business law.",
      sortOrder: 3,
    },
    {
      clientName: "Thomas Anderson",
      rating: 5,
      content:
        "Emily Thompson handled the purchase of our first home. She was incredibly thorough with the title search and made sure every detail was perfect before closing. Thanks to her, the process was smooth and stress-free.",
      sortOrder: 4,
    },
    {
      clientName: "Jennifer Davis",
      rating: 5,
      content:
        "The entire team at Layman Litigation exceeded my expectations. From the initial consultation to the final resolution of my case, they communicated clearly and fought tirelessly on my behalf. I recommend them without hesitation.",
      sortOrder: 5,
    },
  ];

  for (const t of testimonials) {
    const existing = await prisma.testimonial.findFirst({
      where: { siteId: SITE_ID, clientName: t.clientName },
    });
    if (!existing) {
      await prisma.testimonial.create({
        data: {
          siteId: SITE_ID,
          clientName: t.clientName,
          rating: t.rating,
          content: t.content,
          sortOrder: t.sortOrder,
          showHide: true,
        },
      });
      console.log(`  ⭐ Testimonial created: ${t.clientName}`);
    }
  }

  // ── 12. Create FAQs ──
  const faqs = [
    {
      question: "What should I bring to my initial consultation?",
      answer:
        "Bring any documents related to your legal matter, including contracts, correspondence, court papers, police reports, or medical records. Also bring a photo ID and a list of questions you'd like to ask.",
      sortOrder: 0,
      showHide: true,
      schemaMarkup: true,
    },
    {
      question: "How much does a lawyer cost?",
      answer:
        "Our fee structure depends on the type of case. Many personal injury cases are handled on a contingency fee basis (you pay nothing unless we win). For other matters, we offer hourly billing or flat fees. We provide transparent pricing during your free initial consultation.",
      sortOrder: 1,
      showHide: true,
      schemaMarkup: true,
    },
    {
      question: "How long will my case take?",
      answer:
        "Case duration varies widely depending on complexity, court schedules, and whether the case settles or goes to trial. Simple matters may resolve in weeks, while complex litigation can take months or years. Your attorney will provide a realistic timeline during your consultation.",
      sortOrder: 2,
      showHide: true,
      schemaMarkup: true,
    },
    {
      question: "Do I really need a lawyer?",
      answer:
        "While you have the right to represent yourself (pro se), having an experienced attorney significantly improves your chances of a favorable outcome. The legal system is complex, and procedural mistakes can be costly. An attorney understands the law, knows how to present evidence, and can negotiate effectively on your behalf.",
      sortOrder: 3,
      showHide: true,
      schemaMarkup: true,
    },
    {
      question: "What is the difference between a misdemeanor and a felony?",
      answer:
        "Misdemeanors are less serious offenses punishable by up to one year in jail, while felonies are more serious crimes carrying potential prison sentences of more than one year. The classification affects not only potential penalties but also long-term consequences like voting rights and employment opportunities.",
      sortOrder: 4,
      showHide: true,
      schemaMarkup: true,
    },
    {
      question: "How is child custody decided?",
      answer:
        "Courts make custody decisions based on the 'best interest of the child' standard. Factors include each parent's ability to provide stability, the child's emotional bonds, the child's wishes (if old enough), and any history of abuse. Custody can be sole or joint, and legal custody (decision-making) is separate from physical custody (living arrangements).",
      sortOrder: 5,
      showHide: true,
      schemaMarkup: true,
    },
    {
      question: "What should I do if I'm being sued?",
      answer:
        "Do not ignore the lawsuit. You typically have a limited time (often 20-30 days) to respond to a complaint. Contact an attorney immediately. Your attorney will review the claims, advise you on your options, and file an appropriate response to protect your rights.",
      sortOrder: 6,
      showHide: true,
      schemaMarkup: true,
    },
    {
      question: "Can I fire my lawyer?",
      answer:
        "Yes, you have the right to discharge your attorney at any time. However, you may still be responsible for fees for work already performed. If you're considering changing lawyers, it's wise to consult with a new attorney first to ensure a smooth transition.",
      sortOrder: 7,
      showHide: true,
      schemaMarkup: true,
    },
  ];

  for (const faq of faqs) {
    const existing = await prisma.faq.findFirst({
      where: { siteId: SITE_ID, question: faq.question },
    });
    if (!existing) {
      await prisma.faq.create({
        data: {
          siteId: SITE_ID,
          question: faq.question,
          answer: faq.answer,
          sortOrder: faq.sortOrder,
          showHide: faq.showHide,
          schemaMarkup: faq.schemaMarkup,
        },
      });
      console.log(`  ❓ FAQ created: ${faq.question.slice(0, 50)}...`);
    }
  }

  // ── 13. Legal Pages ──
  const legalPages = [
    {
      type: "privacy",
      title: "Privacy Policy",
      content: `<h2>Privacy Policy</h2>
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
      published: true,
    },
    {
      type: "terms",
      title: "Terms of Service",
      content: `<h2>Terms of Service</h2>
<p>Last updated: June 2026</p>
<p>Please read these Terms of Service carefully before using the Layman Litigation website.</p>
<h3>Acceptance of Terms</h3>
<p>By accessing or using our website, you agree to be bound by these Terms. If you do not agree, please do not use our services.</p>
<h3>No Attorney-Client Relationship</h3>
<p>Use of this website or communication with Layman Litigation through this site does not create an attorney-client relationship. Such a relationship is only established through a written engagement agreement.</p>
<h3>Intellectual Property</h3>
<p>All content on this website, including text, graphics, logos, and images, is the property of Layman Litigation and protected by applicable intellectual property laws.</p>
<h3>Limitation of Liability</h3>
<p>Layman Litigation shall not be liable for any damages arising from the use of or inability to use this website or its content.</p>`,
      published: true,
    },
    {
      type: "cookies",
      title: "Cookie Policy",
      content: `<h2>Cookie Policy</h2>
<p>Last updated: June 2026</p>
<p>This Cookie Policy explains how Layman Litigation uses cookies and similar tracking technologies on our website.</p>
<h3>What Are Cookies</h3>
<p>Cookies are small text files stored on your device when you visit a website. They help us improve your browsing experience by remembering your preferences and analyzing site traffic.</p>
<h3>Types of Cookies We Use</h3>
<p>Essential cookies are necessary for the website to function properly. Analytics cookies help us understand how visitors interact with our site. Marketing cookies (if enabled) track your browsing habits for targeted advertising.</p>
<h3>Managing Cookies</h3>
<p>You can control and manage cookies through your browser settings. You may also opt out of non-essential cookies through our cookie consent banner.</p>`,
      published: true,
    },
    {
      type: "disclaimer",
      title: "Disclaimer",
      content: `<h2>Legal Disclaimer</h2>
<p>Last updated: June 2026</p>
<h3>General Information Only</h3>
<p>The content on this website is for informational purposes only and does not constitute legal advice. You should not act or refrain from acting based on any information on this site without seeking professional legal counsel.</p>
<h3>No Guarantee of Results</h3>
<p>Past results and testimonials on this website do not guarantee future outcomes. Every legal case is unique, and results depend on the specific facts and circumstances.</p>
<h3>Third-Party Links</h3>
<p>Our website may contain links to third-party websites. We are not responsible for the content or privacy practices of these sites.</p>`,
      published: true,
    },
    {
      type: "refund",
      title: "Refund Policy",
      content: `<h2>Refund Policy</h2>
<p>Last updated: June 2026</p>
<h3>Legal Service Fees</h3>
<p>Fees for legal services are governed by the terms of your engagement agreement with Layman Litigation. Refund policies, if applicable, will be outlined in your agreement.</p>
<h3>Consultation Fees</h3>
<p>Initial consultations are free of charge. If a consultation fee applies to your situation, it will be disclosed before the consultation.</p>
<h3>Flat Fee Services</h3>
<p>For services provided under a flat fee arrangement, the fee is earned upon receipt and non-refundable once work has commenced, as permitted by applicable rules of professional conduct.</p>
<h3>Questions</h3>
<p>If you have questions about fees or billing, please contact our office at billing@laymanlitigation.com.</p>`,
      published: true,
    },
  ];

  for (const lp of legalPages) {
    const existing = await prisma.legalPage.findFirst({
      where: { siteId: SITE_ID, type: lp.type },
    });
    if (!existing) {
      await prisma.legalPage.create({
        data: {
          siteId: SITE_ID,
          type: lp.type,
          title: lp.title,
          content: lp.content,
          published: lp.published,
          lastUpdated: new Date(),
        },
      });
      console.log(`  📄 Legal page created: ${lp.title}`);
    } else {
      console.log(`  📄 Legal page exists: ${lp.title}`);
    }
  }

  console.log("\n✨ Layman Litigation seeding complete!");
  console.log("   Site ID:", SITE_ID);
  console.log("   Admin login: admin@laymanlitigation.com / Admin123!");
  console.log("   Frontend URL: http://localhost:3001");
  console.log("   Backend URL: http://localhost:3000");
  console.log("   Admin Panel: http://localhost:3000/login");

  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
