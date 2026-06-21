import React from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { pageService } from "@/services/page.service";

// SafeImage helper to support Next.js Image caching or fallback <img>
function SafeImage({ src, alt, ...props }) {
  if (!src) return null;
  const isLocal = src.startsWith("/") || src.startsWith(".") || src.startsWith("..");
  const isCloudinary = src.includes("res.cloudinary.com");

  if (isLocal || isCloudinary) {
    return <Image src={src} alt={alt} {...props} />;
  }

  const { fill, style, ...rest } = props;
  if (fill) {
    return (
      <img
        src={src}
        alt={alt}
        style={{
          position: "absolute",
          height: "100%",
          width: "100%",
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          ...style,
        }}
        {...rest}
      />
    );
  }
  return <img src={src} alt={alt} style={style} {...rest} />;
}

// 1. Fetch Page and its Data Helper
async function getPageData(slugSegments) {
  const rawSlug = (slugSegments || []).join("/");
  const slugWithSlash = "/" + rawSlug;
  const slugWithoutSlash = rawSlug;
  
  // Find active site
  const site = await prisma.site.findFirst({
    where: { isActive: true, deletedAt: null },
  });
  if (!site) return null;

  // Find page by slug and site
  const page = await prisma.page.findFirst({
    where: {
      siteId: site.id,
      slug: { in: [slugWithSlash, slugWithoutSlash] },
      status: "PUBLISHED",
      deletedAt: null,
    },
    include: {
      sections: {
        where: { isDeleted: false, isVisible: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!page) return null;

  // Resolve referenced media IDs
  const mediaIds = new Set();
  page.sections.forEach((s) => {
    const c = s.content || {};
    if (c.bannerMediaId) mediaIds.add(c.bannerMediaId);
    if (c.imageMediaId) mediaIds.add(c.imageMediaId);
  });

  let mediaMap = {};
  if (mediaIds.size > 0) {
    const mediaRows = await prisma.media.findMany({
      where: { id: { in: Array.from(mediaIds) } },
      select: { id: true, secureUrl: true, url: true },
    });
    mediaMap = mediaRows.reduce((acc, m) => {
      acc[m.id] = m.secureUrl || m.url || null;
      return acc;
    }, {});
  }

  // Populate sections with URLs and reference items
  const populatedSections = await Promise.all(
    page.sections.map(async (s) => {
      const content = { ...(s.content || {}) };
      if (content.bannerMediaId && mediaMap[content.bannerMediaId]) {
        content.bannerUrl = mediaMap[content.bannerMediaId];
      }
      if (content.imageMediaId && mediaMap[content.imageMediaId]) {
        content.imageUrl = mediaMap[content.imageMediaId];
      }

      // Fetch dynamic collection list items
      const type = String(s.type || "").toUpperCase();
      if (type === "SERVICES") {
        content.items = await prisma.service.findMany({
          where: { siteId: site.id, status: "ACTIVE", deletedAt: null },
          orderBy: { sortOrder: "asc" },
        });
      } else if (type === "TEAM") {
        content.items = await prisma.teamMember.findMany({
          where: { siteId: site.id, deletedAt: null },
          orderBy: { sortOrder: "asc" },
        });
      } else if (type === "TESTIMONIALS") {
        content.items = await prisma.testimonial.findMany({
          where: { siteId: site.id, showHide: true, deletedAt: null },
          orderBy: { sortOrder: "asc" },
        });
      } else if (type === "FAQ") {
        content.items = await prisma.faq.findMany({
          where: { siteId: site.id, showHide: true, deletedAt: null },
          orderBy: { sortOrder: "asc" },
        });
      }

      return { ...s, content };
    })
  );

  // Fetch Site Global Settings
  const settings = await prisma.globalSettings.findUnique({
    where: { siteId: site.id },
  });

  return { page, sections: populatedSections, site, settings };
}

// 2. Next.js Dynamic Metadata Generation
export async function generateMetadata({ params }) {
  const p = await params;
  const data = await getPageData(p.slug);
  if (!data) return {};

  const { page } = data;
  const title = page.seoTitle || page.title;
  const desc = page.seoDescription || "";
  const canonical = page.canonicalUrl || undefined;
  const ogImg = page.ogImage || undefined;

  return {
    title,
    description: desc,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description: desc,
      images: ogImg ? [{ url: ogImg }] : [],
    },
  };
}

// 3. Section Component Renderers
function HeroSection({ content }) {
  const bg = content?.bannerUrl || content?.backgroundUrl;
  const alignClass = content?.alignment === "left" 
    ? "text-left justify-start" 
    : content?.alignment === "right" 
      ? "text-right justify-end" 
      : "text-center justify-center";

  return (
    <section className="relative w-full min-h-[500px] flex items-center bg-slate-900 text-white overflow-hidden py-16">
      {bg && (
        <div className="absolute inset-0 z-0">
          <SafeImage
            src={bg}
            alt={content?.title || "Hero Banner"}
            fill
            style={{ objectFit: "cover" }}
            priority
          />
          <div className="absolute inset-0 bg-slate-950/60" />
        </div>
      )}
      <div className={`relative z-10 w-full max-w-7xl mx-auto px-6 flex ${alignClass}`}>
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 animate-fade-in">
            {content?.title}
          </h1>
          {content?.subtitle && (
            <p className="text-lg md:text-xl text-slate-200 mb-8 max-w-2xl font-light">
              {content.subtitle}
            </p>
          )}
          <div className="flex flex-wrap gap-4 items-center justify-center lg:justify-start">
            {content?.primaryButton?.text && (
              <a
                href={content.primaryButton.url || "/"}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow transition-all hover:-translate-y-0.5"
              >
                {content.primaryButton.text}
              </a>
            )}
            {content?.secondaryButton?.text && (
              <a
                href={content.secondaryButton.url || "/"}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg font-semibold backdrop-blur-xs transition-all hover:-translate-y-0.5"
              >
                {content.secondaryButton.text}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function TextBlockSection({ content }) {
  const directionClass = content?.imagePosition === "left"
    ? "md:flex-row"
    : content?.imagePosition === "right"
      ? "md:flex-row-reverse"
      : "flex-col";

  return (
    <section className="py-16 bg-white text-slate-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className={`flex flex-col gap-10 items-center ${directionClass}`}>
          {content?.imageUrl && (
            <div className="w-full md:w-1/2 relative h-[320px] rounded-xl overflow-hidden shadow-md">
              <SafeImage
                src={content.imageUrl}
                alt={content?.title || "Image Block"}
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
          )}
          <div className={content?.imageUrl ? "w-full md:w-1/2" : "w-full max-w-3xl mx-auto"}>
            {content?.title && (
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
                {content.title}
              </h2>
            )}
            {content?.body && (
              <div 
                className="prose prose-slate prose-lg text-slate-650 max-w-none space-y-4"
                dangerouslySetInnerHTML={{ __html: content.body }}
              />
            )}
            {content?.cta?.text && (
              <div className="mt-8">
                <a
                  href={content.cta.url || "/"}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow transition"
                >
                  {content.cta.text}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ServicesSection({ content }) {
  const items = content?.items || [];
  return (
    <section className="py-16 bg-slate-50 text-slate-800 border-t border-b">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Our Services</h2>
          <p className="text-slate-500 mt-2 text-sm">Professional services customized to help you grow your brand identity.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-xs border hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">{item.description}</p>
              </div>
              <div className="border-t pt-4 flex items-center justify-between mt-4">
                <span className="font-mono text-sm font-bold text-blue-600">{item.price || "Contact Us"}</span>
                {item.ctaButtonText && (
                  <a
                    href={item.ctaButtonLink || "/"}
                    className="px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded text-xs font-semibold"
                  >
                    {item.ctaButtonText}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TeamSection({ content }) {
  const items = content?.items || [];
  return (
    <section className="py-16 bg-white text-slate-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Meet Our Team</h2>
          <p className="text-slate-500 mt-2 text-sm">Our group of expert professionals and leaders.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {items.map((member) => (
            <div key={member.id} className="text-center group">
              <div className="relative w-40 h-40 mx-auto rounded-full overflow-hidden mb-4 border-2 border-indigo-100 group-hover:border-indigo-500 transition duration-200">
                {member.photo ? (
                  <SafeImage
                    src={member.photo}
                    alt={member.name}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-indigo-400 font-bold text-3xl">
                    {member.name.charAt(0)}
                  </div>
                )}
              </div>
              <h3 className="font-bold text-slate-900 text-base">{member.name}</h3>
              <p className="text-xs text-indigo-650 font-semibold mb-1">{member.role}</p>
              {member.bio && <p className="text-[11px] text-slate-400 max-w-xs mx-auto line-clamp-2 px-2">{member.bio}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection({ content }) {
  const items = content?.items || [];
  return (
    <section className="py-16 bg-indigo-900 text-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold tracking-tight">Client Feedback</h2>
          <p className="text-indigo-200 mt-2 text-sm">Hear directly what our global partners say about us.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((item) => (
            <div key={item.id} className="bg-indigo-950/40 p-6 rounded-xl border border-indigo-850 backdrop-blur-xs flex flex-col justify-between">
              <div>
                <div className="flex gap-1 mb-4 text-amber-400 font-mono text-sm">
                  {Array.from({ length: item.rating || 5 }).map((_, idx) => (
                    <span key={idx}>★</span>
                  ))}
                </div>
                <p className="text-slate-200 text-xs italic leading-relaxed mb-6">"{item.content}"</p>
              </div>
              <div className="flex items-center gap-3 border-t border-indigo-850 pt-4">
                {item.clientImage ? (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden">
                    <SafeImage src={item.clientImage} alt={item.clientName} fill style={{ objectFit: "cover" }} />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-800 flex items-center justify-center text-[10px] font-bold">
                    {item.clientName.charAt(0)}
                  </div>
                )}
                <span className="font-semibold text-xs text-white">{item.clientName}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection({ content }) {
  const items = content?.items || [];
  return (
    <section className="py-16 bg-white text-slate-800">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">FAQ</h2>
          <p className="text-slate-500 mt-2 text-sm">Common questions and detailed answers.</p>
        </div>
        <div className="space-y-4">
          {items.map((faq) => (
            <div key={faq.id} className="border rounded-lg p-5 hover:bg-slate-50/50 transition">
              <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-start gap-2">
                <span className="text-blue-600">Q.</span>
                {faq.question}
              </h3>
              <p className="text-slate-600 text-xs pl-6 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection({ content }) {
  return (
    <section className="py-12 bg-linear-to-r from-blue-600 to-indigo-600 text-white">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">{content?.title || "Ready to scale up?"}</h2>
        {content?.subtitle && <p className="text-sm text-blue-100 max-w-2xl mx-auto mb-6">{content.subtitle}</p>}
        {content?.primaryButtonText && (
          <a
            href={content.primaryButtonUrl || "/"}
            className="px-6 py-2.5 bg-white text-blue-600 font-semibold rounded hover:bg-blue-50 transition shadow"
          >
            {content.primaryButtonText}
          </a>
        )}
      </div>
    </section>
  );
}

// 4. Main Server Catch-All Page Component
export default async function CatchAllPage({ params }) {
  const p = await params;
  const data = await getPageData(p.slug);

  if (!data) {
    return notFound();
  }

  const { page, sections, site, settings } = data;
  const headerSettings = settings?.header || {};
  const footerSettings = settings?.footer || {};
  const websiteSettings = settings?.websiteSettings || {};
  const navigation = settings?.navigation?.links || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 flex flex-col justify-between">
      {/* JSON-LD Schema Markup Injection */}
      {page.jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(page.jsonLd) }}
        />
      )}

      {/* Dynamic Header */}
      <header className={`bg-white border-b z-40 ${headerSettings.sticky ? "sticky top-0 shadow-xs" : ""}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {websiteSettings.logoUrl ? (
              <img
                src={websiteSettings.logoUrl}
                alt="Logo"
                style={{ height: `${headerSettings.logoHeight || 40}px`, objectFit: "contain" }}
              />
            ) : (
              <span className="font-extrabold text-lg text-slate-900">{site.name}</span>
            )}
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-650">
            {navigation.map((link, idx) => (
              <a key={idx} href={link.url} className="hover:text-blue-600 transition">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="/api/auth/signin"
              className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-bold hover:bg-slate-800 transition"
            >
              Sign In
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="grow">
        {sections.map((s) => {
          const type = String(s.type || "").toUpperCase();
          if (type === "HERO") return <HeroSection key={s.id} content={s.content} />;
          if (type === "TEXT_BLOCK") return <TextBlockSection key={s.id} content={s.content} />;
          if (type === "SERVICES") return <ServicesSection key={s.id} content={s.content} />;
          if (type === "TEAM") return <TeamSection key={s.id} content={s.content} />;
          if (type === "TESTIMONIALS") return <TestimonialsSection key={s.id} content={s.content} />;
          if (type === "FAQ") return <FaqSection key={s.id} content={s.content} />;
          if (type === "CTA") return <CtaSection key={s.id} content={s.content} />;

          return (
            <section key={s.id} className="py-8 max-w-7xl mx-auto px-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Fallback: {s.type} Section
              </span>
              <pre className="p-4 bg-white border rounded text-xs font-mono overflow-auto">
                {JSON.stringify(s.content, null, 2)}
              </pre>
            </section>
          );
        })}
      </main>

      {/* Dynamic Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-white font-bold text-sm mb-4">{site.name}</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Powered by the Global Backend Headless CMS. High performance modular setups.
            </p>
          </div>
          <div>
            <h5 className="text-white font-bold text-xs mb-3">Links</h5>
            <div className="flex flex-col gap-2 text-xs">
              {navigation.slice(0, 4).map((link, idx) => (
                <a key={idx} href={link.url} className="hover:text-white transition">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div>
            <h5 className="text-white font-bold text-xs mb-3 font-mono">Status</h5>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-950 px-2 py-0.5 text-[9px] font-bold text-green-400 border border-green-900 uppercase tracking-wider">
              <span className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
              Live & Synced
            </span>
          </div>
          <div>
            <h5 className="text-white font-bold text-xs mb-3">Copyright</h5>
            <p className="text-[10px] text-slate-550 leading-relaxed">
              {footerSettings.copyright || `© ${new Date().getFullYear()} ${site.name}. All rights reserved.`}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
