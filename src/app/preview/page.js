// src/app/preview/page.js
export const dynamic = "force-dynamic";

import React from "react";
import Image from "next/image";
import prisma from "@/lib/prisma";
import ContactFormSection from "@/components/ContactFormSection";

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

/*
  Preview page (server component)
  - URL: /preview?pageId=<PAGE_ID>&siteId=<SITE_ID>
  - Fetches page and sections directly with Prisma (no internal HTTP fetch).
  - Resolves media ids (bannerMediaId / imageMediaId) to URLs for rendering.
  - Renders HERO and TEXT_BLOCK types; unknown types render JSON.
*/

function Hero({ content }) {
  const bg = content?.bannerUrl || content?.backgroundUrl;
  return (
    <section className="relative w-full h-[420px] bg-gray-800 text-white overflow-hidden">
      {bg ? (
        <div className="absolute inset-0">
          <SafeImage
            src={bg}
            alt={content?.subtitle || content?.title || "Hero"}
            fill
            style={{ objectFit: "cover" }}
            priority
          />
          <div className="absolute inset-0 bg-[rgba(0,0,0,0.35)]" />
        </div>
      ) : null}

      <div className="relative z-10 container mx-auto px-6 h-full flex items-center">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-2">{content?.title}</h1>
          {content?.subtitle ? (
            <p className="text-lg mb-4">{content.subtitle}</p>
          ) : null}
          <div className="flex gap-3">
            {content?.primaryButton ? (
              <a
                href={content.primaryButton.url || "#"}
                className="px-4 py-2 bg-blue-600 rounded text-white"
              >
                {content.primaryButton.text}
              </a>
            ) : null}
            {content?.secondaryButton ? (
              <a
                href={content.secondaryButton.url || "#"}
                className="px-4 py-2 bg-white text-black rounded"
              >
                {content.secondaryButton.text}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function TextBlock({ content }) {
  return (
    <section className="container mx-auto px-6 py-10">
      <div className="max-w-3xl mx-auto">
        {content?.title ? (
          <h2 className="text-2xl font-semibold mb-3">{content.title}</h2>
        ) : null}
        {content?.imageUrl && (
          <div className="mb-4 relative w-full h-56 rounded overflow-hidden">
            <SafeImage
              src={content.imageUrl}
              alt={content.title || ""}
              fill
              style={{ objectFit: "cover" }}
              sizes="(max-width: 640px) 100vw, 600px"
            />
          </div>
        )}
        {content?.body ? (
          <div
            className="prose prose-lg"
            dangerouslySetInnerHTML={{ __html: content.body }}
          />
        ) : null}
        {content?.cta ? (
          <div className="mt-4">
            <a
              href={content.cta.url || "#"}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              {content.cta.text}
            </a>
          </div>
        ) : null}
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
              <p className="text-slate-650 text-xs pl-6 leading-relaxed">{faq.answer}</p>
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

function BlogsSection({ content }) {
  const items = content?.items || [];
  return (
    <section className="py-16 bg-white text-slate-800 border-t border-b">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {content?.title || "Latest Articles"}
          </h2>
          <p className="text-slate-500 mt-2 text-sm">
            {content?.description || "Stay updated with our latest news and corporate insights."}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((post) => (
            <a
              key={post.id}
              href={`/blogs/${post.slug}`}
              className="group block bg-white rounded-xl shadow-xs border hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              {post.featuredImage && (
                <div className="relative w-full aspect-16/10">
                  <SafeImage
                    src={post.featuredImage.secureUrl || post.featuredImage.url}
                    alt={post.title}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </div>
              )}
              <div className="p-6">
                <div className="flex gap-2 mb-2 flex-wrap">
                  {post.categories.map((c) => (
                    <span
                      key={c.id}
                      className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-650"
                    >
                      {c.name}
                    </span>
                  ))}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-group-hover:text-indigo-600 transition truncate">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-xs text-slate-505 leading-relaxed line-clamp-2 mb-4 mt-1">
                    {post.excerpt}
                  </p>
                )}
                <div className="text-[10px] text-slate-400 font-semibold mt-4 pt-4 border-t flex justify-between">
                  <span>By {post.author ? post.author.email.split("@")[0] : "Author"}</span>
                  <span>
                    {new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function PreviewPage({ searchParams }) {
  // Unwrap searchParams if it's a promise-like in this runtime
  const sp = await searchParams;
  const pageId = sp?.pageId;
  const siteId = sp?.siteId;

  if (!pageId || !siteId) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">Preview</h1>
        <p className="text-red-600 mt-4">
          pageId and siteId query params are required.
        </p>
        <p className="mt-2">Usage: /preview?pageId=&siteId=</p>
      </div>
    );
  }

  // Fetch page directly with Prisma
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: { id: true, title: true, slug: true, status: true, siteId: true },
  });

  if (!page || String(page.siteId) !== String(siteId)) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">Preview Error</h1>
        <pre className="mt-4 bg-gray-100 p-4 rounded text-sm text-red-700">
          Page not found or siteId mismatch
        </pre>
      </div>
    );
  }

  // Fetch Site and settings
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: { name: true }
  }) || { name: "Default Website" };

  const settings = await prisma.globalSettings.findUnique({
    where: { siteId },
  });

  let sections = await prisma.section.findMany({
    where: { pageId: page.id, isDeleted: false },
    orderBy: { order: "asc" },
  });

  // Collect referenced media IDs
  const mediaIds = new Set();
  sections.forEach((s) => {
    const content = s.content || {};
    if (content.bannerMediaId) mediaIds.add(content.bannerMediaId);
    if (content.imageMediaId) mediaIds.add(content.imageMediaId);
  });

  // Fetch media rows for referenced ids
  let mediaRows = [];
  if (mediaIds.size > 0) {
    mediaRows = await prisma.media.findMany({
      where: { id: { in: Array.from(mediaIds) } },
      select: { id: true, secureUrl: true, url: true, altText: true },
    });
  }

  // Build map id -> url
  const mediaMap = mediaRows.reduce((acc, m) => {
    acc[m.id] = m.secureUrl || m.url || null;
    return acc;
  }, {});

  // Inject URLs and dynamic collection items into section.content for preview rendering
  sections = await Promise.all(
    sections.map(async (s) => {
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
          where: { siteId, status: "ACTIVE", deletedAt: null },
          orderBy: { sortOrder: "asc" },
        });
      } else if (type === "TEAM") {
        content.items = await prisma.teamMember.findMany({
          where: { siteId, deletedAt: null },
          orderBy: { sortOrder: "asc" },
        });
      } else if (type === "TESTIMONIALS") {
        content.items = await prisma.testimonial.findMany({
          where: { siteId, showHide: true, deletedAt: null },
          orderBy: { sortOrder: "asc" },
        });
      } else if (type === "FAQ") {
        content.items = await prisma.faq.findMany({
          where: { siteId, showHide: true, deletedAt: null },
          orderBy: { sortOrder: "asc" },
        });
      } else if (type === "BLOGS") {
        content.items = await prisma.post.findMany({
          where: { siteId, status: "PUBLISHED", deletedAt: null },
          orderBy: { publishedAt: "desc" },
          take: 6,
          include: {
            featuredImage: true,
            categories: true,
            author: { select: { email: true } },
          },
        });
      }

      return { ...s, content };
    })
  );
  const headerSettings = settings?.header || {};
  const footerSettings = settings?.footer || {};
  const websiteSettings = settings?.websiteSettings || {};
  const headerMenuType = headerSettings.menuType || "main";
  const navigation = settings?.navigation?.[headerMenuType] || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 flex flex-col justify-between">
      {/* Preview Banner */}
      <div className="bg-amber-500 text-white text-center py-1.5 text-[10px] font-bold uppercase tracking-wider sticky top-0 z-50 shadow-sm">
        ⚡ Preview Mode &mdash; Viewing Draft Layout for "{page.title || page.slug}"
      </div>

      {/* Dynamic Header */}
      <header className={`bg-white border-b z-40 ${headerSettings.sticky ? "sticky top-16 shadow-xs" : ""}`}>
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
            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-[9px] font-bold uppercase">
              Draft
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="grow">
        {sections
          .filter((s) => s.isVisible !== false)
          .map((s) => {
            const type = String(s.type || "").toUpperCase();
            if (type === "HERO") return <Hero key={s.id} content={s.content} />;
            if (type === "TEXT_BLOCK") return <TextBlock key={s.id} content={s.content} />;
            if (type === "SERVICES") return <ServicesSection key={s.id} content={s.content} />;
            if (type === "TEAM") return <TeamSection key={s.id} content={s.content} />;
            if (type === "TESTIMONIALS") return <TestimonialsSection key={s.id} content={s.content} />;
            if (type === "FAQ") return <FaqSection key={s.id} content={s.content} />;
            if (type === "CTA") return <CtaSection key={s.id} content={s.content} />;
            if (type === "BLOGS") return <BlogsSection key={s.id} content={s.content} />;
            if (type === "CONTACT_FORM") {
              return (
                <ContactFormSection
                  key={s.id}
                  siteId={siteId}
                  content={s.content}
                  recaptchaSiteKey={settings?.securityControls?.recaptchaSiteKey || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                />
              );
            }

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
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-950 px-2 py-0.5 text-[9px] font-bold text-amber-400 border border-amber-900 uppercase tracking-wider">
              <span className="h-1 w-1 rounded-full bg-amber-500 animate-pulse" />
              Previewing Draft
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
