import React from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import prisma from "@/lib/prisma";
import ContactFormSection from "@/components/ContactFormSection";
import Script from "next/script";
// SafeImage helper to support Next.js Image caching or fallback <img>
function SafeImage({ src, alt, ...props }) {
  if (!src) return null;
  const isLocal =
    src.startsWith("/") || src.startsWith(".") || src.startsWith("..");
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

// Simple client-safe markdown-to-HTML parser function
function renderMarkdown(markdownText) {
  if (!markdownText) return "";

  // Escape HTML tags to prevent XSS if necessary, but keep formatting
  let html = markdownText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 1. Code blocks: ```lang ... ```
  html = html.replace(/```([\s\S]*?)```/g, (match, p1) => {
    return `<pre class="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs my-6 overflow-x-auto"><code>${p1.trim()}</code></pre>`;
  });

  // 2. Headings
  html = html.replace(
    /^# (.*?)$/gm,
    '<h1 class="text-3xl font-extrabold text-slate-900 mt-8 mb-4">$1</h1>',
  );
  html = html.replace(
    /^## (.*?)$/gm,
    '<h2 class="text-2xl font-extrabold text-slate-900 mt-8 mb-4">$1</h2>',
  );
  html = html.replace(
    /^### (.*?)$/gm,
    '<h3 class="text-xl font-bold text-slate-900 mt-6 mb-3">$1</h3>',
  );
  html = html.replace(
    /^#### (.*?)$/gm,
    '<h4 class="text-lg font-bold text-slate-900 mt-4 mb-2">$1</h4>',
  );

  // 3. Blockquotes: > quote
  html = html.replace(
    /^&gt; (.*?)$/gm,
    '<blockquote class="border-l-4 border-indigo-500 pl-4 py-1 italic text-slate-650 my-6 bg-slate-50 rounded-r-lg">$1</blockquote>',
  );

  // 4. Unordered Lists: * item or - item
  html = html.replace(
    /^(?:\*|-)\s+(.*?)$/gm,
    '<li class="list-disc ml-6 mb-2">$1</li>',
  );

  // 5. Ordered Lists: 1. item
  html = html.replace(
    /^(\d+)\.\s+(.*?)$/gm,
    '<li class="list-decimal ml-6 mb-2">$2</li>',
  );

  // 6. Bold: **text** or __text__
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.*?)__/g, "<strong>$1</strong>");

  // 7. Italic: *text* or _text_
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.*?)_/g, "<em>$1</em>");

  // 8. Inline Code: `code`
  html = html.replace(
    /`(.*?)`/g,
    '<code class="bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded font-mono text-[0.9em]">$1</code>',
  );

  // 9. Images: ![alt](url)
  html = html.replace(
    /!\[(.*?)\]\((.*?)\)/g,
    '<img src="$2" alt="$1" class="my-8 rounded-xl max-w-full h-auto mx-auto shadow-md" />',
  );

  // 10. Links: [text](url)
  html = html.replace(
    /\[(.*?)\]\((.*?)\)/g,
    '<a href="$2" class="text-indigo-600 hover:text-indigo-800 underline font-semibold transition" target="_blank" rel="noopener noreferrer">$1</a>',
  );

  // 11. Paragraphs (lines that aren't tags)
  const blocks = html.split(/\n\n+/);
  const formattedBlocks = blocks.map((block) => {
    const trimmed = block.trim();
    if (!trimmed) return "";

    const isBlockTag = /^(<h[1-6]|<pre|<blockquote|<ul|<ol|<li|<img|<p)/i.test(
      trimmed,
    );
    if (isBlockTag) {
      return trimmed;
    }

    const paragraphs = trimmed.split("\n").join("<br />");
    return `<p class="text-slate-650 leading-relaxed mb-5">${paragraphs}</p>`;
  });

  let parsed = formattedBlocks.join("\n");

  // Group consecutive list items
  parsed = parsed.replace(/(<li class="list-disc.*<\/li>\n?)+/g, (match) => {
    return `<ul class="my-6 space-y-1">${match}</ul>`;
  });
  parsed = parsed.replace(/(<li class="list-decimal.*<\/li>\n?)+/g, (match) => {
    return `<ol class="my-6 space-y-1">${match}</ol>`;
  });

  return parsed;
}

// Reusable detailed blog post UI component
function BlogPostDetail({ post, site, settings }) {
  const categories = post.categories || [];

  let rawContent = "";
  if (typeof post.content === "string") {
    rawContent = post.content;
  } else if (post.content) {
    try {
      rawContent =
        typeof post.content === "object"
          ? JSON.stringify(post.content)
          : String(post.content);
      if (rawContent.startsWith('"') && rawContent.endsWith('"')) {
        rawContent = JSON.parse(rawContent);
      }
    } catch (_) {
      rawContent = String(post.content);
    }
  }

  const contentHtml = renderMarkdown(rawContent);

  return (
    <article className="max-w-4xl mx-auto px-6 py-12">
      {/* Breadcrumbs Navigation */}
      <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mb-6 uppercase tracking-wider">
        <a href="/" className="hover:text-indigo-600 transition">
          Home
        </a>
        <span>/</span>
        <a href="/blog" className="hover:text-indigo-600 transition">
          Blog
        </a>
        <span>/</span>
        <span className="text-slate-600 truncate max-w-xs">{post.title}</span>
      </nav>

      {/* Header Info */}
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {categories.map((c) => (
            <span
              key={c.id}
              className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-650 border border-indigo-100"
            >
              {c.name}
            </span>
          ))}
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
          {post.title}
        </h1>
        <div className="flex items-center gap-3 pb-6 border-b border-slate-200">
          <div className="w-10 h-10 rounded-full bg-linear-to-tr from-indigo-500 to-blue-500 flex items-center justify-center text-white font-extrabold shadow-xs">
            {post.author ? post.author.email.charAt(0).toUpperCase() : "A"}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">
              {post.author ? post.author.email.split("@")[0] : "Author"}
            </p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              {post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : new Date(post.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
            </p>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      {post.featuredImage && (
        <div className="relative w-full aspect-16/10 md:aspect-21/9 rounded-2xl overflow-hidden shadow-xs mb-10 border border-slate-100">
          <SafeImage
            src={post.featuredImage.secureUrl || post.featuredImage.url}
            alt={post.title}
            fill
            style={{ objectFit: "cover" }}
            priority
          />
        </div>
      )}

      {/* Excerpt */}
      {post.excerpt && (
        <p className="text-lg md:text-xl font-light text-slate-500 leading-relaxed mb-8 italic pl-4 border-l-4 border-slate-350">
          {post.excerpt}
        </p>
      )}

      {/* Body Content */}
      <div
        className="blog-prose"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />

      {/* Category Footer */}
      {categories.length > 0 && (
        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Filed Under:
          </span>
          {categories.map((c) => (
            <span
              key={c.id}
              className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-650 transition cursor-pointer"
            >
              {c.name}
            </span>
          ))}
        </div>
      )}
    </article>
  );
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

  // Detect detailed blog post path, e.g. /blogs/[slug] or /blog/[slug]
  const isBlogPath =
    Array.isArray(slugSegments) &&
    slugSegments.length === 2 &&
    (slugSegments[0] === "blogs" || slugSegments[0] === "blog");

  if (isBlogPath) {
    const postSlug = slugSegments[1];
    const post = await prisma.post.findFirst({
      where: {
        siteId: site.id,
        slug: postSlug,
        status: "PUBLISHED",
        deletedAt: null,
      },
      include: {
        author: { select: { id: true, email: true } },
        featuredImage: true,
        categories: true,
      },
    });

    if (post) {
      const settings = await prisma.globalSettings.findUnique({
        where: { siteId: site.id },
      });
      return { isBlog: true, post, site, settings };
    }
  }

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
          where: {
            siteId: site.id,
            showHide: true,
            deletedAt: null,
            OR: [{ pageId: null }, { pageId: page.id }],
          },
          orderBy: { sortOrder: "asc" },
        });
      } else if (type === "BLOGS") {
        content.items = await prisma.post.findMany({
          where: { siteId: site.id, status: "PUBLISHED", deletedAt: null },
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
    }),
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

  if (data.isBlog) {
    const { post } = data;
    const title = post.seoTitle || post.title;
    const desc = post.seoDescription || post.excerpt || "";
    const canonical = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/blogs/${post.slug}`;
    const ogImg =
      post.featuredImage?.secureUrl || post.featuredImage?.url || undefined;

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
  const alignClass =
    content?.alignment === "left"
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
      <div
        className={`relative z-10 w-full max-w-7xl mx-auto px-6 flex ${alignClass}`}
      >
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
  const directionClass =
    content?.imagePosition === "left"
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
          <div
            className={
              content?.imageUrl ? "w-full md:w-1/2" : "w-full max-w-3xl mx-auto"
            }
          >
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
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Our Services
          </h2>
          <p className="text-slate-500 mt-2 text-sm">
            Professional services customized to help you grow your brand
            identity.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-xs border hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  {item.description}
                </p>
              </div>
              <div className="border-t pt-4 flex items-center justify-between mt-4">
                <span className="font-mono text-sm font-bold text-blue-600">
                  {item.price || "Contact Us"}
                </span>
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
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Meet Our Team
          </h2>
          <p className="text-slate-500 mt-2 text-sm">
            Our group of expert professionals and leaders.
          </p>
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
              <h3 className="font-bold text-slate-900 text-base">
                {member.name}
              </h3>
              <p className="text-xs text-indigo-650 font-semibold mb-1">
                {member.role}
              </p>
              {member.bio && (
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto line-clamp-2 px-2">
                  {member.bio}
                </p>
              )}
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
          <h2 className="text-3xl font-extrabold tracking-tight">
            Client Feedback
          </h2>
          <p className="text-indigo-200 mt-2 text-sm">
            Hear directly what our global partners say about us.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-indigo-950/40 p-6 rounded-xl border border-indigo-850 backdrop-blur-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex gap-1 mb-4 text-amber-400 font-mono text-sm">
                  {Array.from({ length: item.rating || 5 }).map((_, idx) => (
                    <span key={idx}>★</span>
                  ))}
                </div>
                <p className="text-slate-200 text-xs italic leading-relaxed mb-6">
                  "{item.content}"
                </p>
              </div>
              <div className="flex items-center gap-3 border-t border-indigo-850 pt-4">
                {item.clientImage ? (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden">
                    <SafeImage
                      src={item.clientImage}
                      alt={item.clientName}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-800 flex items-center justify-center text-[10px] font-bold">
                    {item.clientName.charAt(0)}
                  </div>
                )}
                <span className="font-semibold text-xs text-white">
                  {item.clientName}
                </span>
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
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            FAQ
          </h2>
          <p className="text-slate-500 mt-2 text-sm">
            Common questions and detailed answers.
          </p>
        </div>
        <div className="space-y-4">
          {items.map((faq) => (
            <div
              key={faq.id}
              className="border rounded-lg p-5 hover:bg-slate-50/50 transition"
            >
              <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-start gap-2">
                <span className="text-blue-600">Q.</span>
                {faq.question}
              </h3>
              <p className="text-slate-600 text-xs pl-6 leading-relaxed">
                {faq.answer}
              </p>
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
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          {content?.title || "Ready to scale up?"}
        </h2>
        {content?.subtitle && (
          <p className="text-sm text-blue-100 max-w-2xl mx-auto mb-6">
            {content.subtitle}
          </p>
        )}
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
    <section className="py-16 bg-white text-slate-800 border-t border-b animate-fade-in">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {content?.title || "Latest Articles"}
          </h2>
          <p className="text-slate-500 mt-2 text-sm">
            {content?.description ||
              "Stay updated with our latest news and corporate insights."}
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
                  <span>
                    By{" "}
                    {post.author ? post.author.email.split("@")[0] : "Author"}
                  </span>
                  <span>
                    {new Date(
                      post.publishedAt || post.createdAt,
                    ).toLocaleDateString("en-US", {
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

function PublicHeader({ site, settings }) {
  const headerSettings = settings?.header || {};
  const websiteSettings = settings?.websiteSettings || {};

  const headerMenuType = headerSettings.menuType || "main";
  const navigation = settings?.navigation?.[headerMenuType] || [];
  const isSticky = headerSettings.sticky ?? true;
  const isTransparent = headerSettings.transparent ?? false;

  const paddingYClass =
    headerSettings.paddingY === "small"
      ? "py-2"
      : headerSettings.paddingY === "large"
        ? "py-6"
        : "py-4";

  const shadowClass =
    headerSettings.shadowSize === "none"
      ? "shadow-none"
      : headerSettings.shadowSize === "medium"
        ? "shadow"
        : "shadow-xs";

  const borderClass = headerSettings.borderBottom !== false ? "border-b" : "";

  const renderLogo = () => {
    if (headerSettings.logoType === "text") {
      return (
        <span className="font-extrabold text-lg text-slate-900">
          {headerSettings.logoText || site.name}
        </span>
      );
    }
    const logoSrc = websiteSettings.logoUrl || "/next.svg";
    return (
      <img
        src={logoSrc}
        alt="Logo"
        style={{
          width: headerSettings.logoWidth
            ? `${headerSettings.logoWidth}px`
            : "auto",
          height: headerSettings.logoHeight
            ? `${headerSettings.logoHeight}px`
            : "40px",
          objectFit: "contain",
        }}
      />
    );
  };

  let leftLinks = [];
  let rightLinks = [];
  if (headerSettings.layout === "logo-split") {
    const mid = Math.ceil(navigation.length / 2);
    leftLinks = navigation.slice(0, mid);
    rightLinks = navigation.slice(mid);
  }

  const ctaButton =
    headerSettings.ctaText && headerSettings.ctaLink ? (
      <a
        href={headerSettings.ctaLink}
        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold whitespace-nowrap shadow-sm transition"
      >
        {headerSettings.ctaText}
      </a>
    ) : null;

  const signInBtn = (
    <a
      href="/api/auth/signin"
      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold transition whitespace-nowrap shrink-0"
    >
      Sign In
    </a>
  );

  const renderHeaderContent = () => {
    switch (headerSettings.layout) {
      case "logo-center":
        return (
          <div
            className={`max-w-7xl mx-auto px-6 ${paddingYClass} flex items-center justify-between relative`}
          >
            <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-650">
              {navigation.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  className="hover:text-blue-600 transition"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="absolute left-1/2 -translate-x-1/2 shrink-0 flex items-center">
              {renderLogo()}
            </div>
            <div className="flex items-center gap-3 z-10">
              {ctaButton}
              {signInBtn}
            </div>
          </div>
        );

      case "logo-split":
        return (
          <div
            className={`max-w-7xl mx-auto px-6 ${paddingYClass} flex items-center justify-between`}
          >
            <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-650">
              {leftLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  className="hover:text-blue-600 transition"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="shrink-0 flex items-center">{renderLogo()}</div>
            <div className="flex items-center gap-6">
              <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-650">
                {rightLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    className="hover:text-blue-600 transition"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              {signInBtn}
            </div>
          </div>
        );

      case "logo-right":
        return (
          <div
            className={`max-w-7xl mx-auto px-6 ${paddingYClass} flex items-center justify-between`}
          >
            <div className="flex items-center gap-3">
              {ctaButton}
              {signInBtn}
            </div>
            <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-650">
              {navigation.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  className="hover:text-blue-600 transition"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="shrink-0 flex items-center">{renderLogo()}</div>
          </div>
        );

      case "stacked":
        return (
          <div
            className={`max-w-7xl mx-auto px-6 ${paddingYClass} flex flex-col items-center gap-3`}
          >
            <div className="shrink-0 flex items-center">{renderLogo()}</div>
            <div className="w-full flex justify-between items-center pt-2 border-t border-slate-100">
              <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-650">
                {navigation.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    className="hover:text-blue-600 transition"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              <div className="flex items-center gap-3">
                {ctaButton}
                {signInBtn}
              </div>
            </div>
          </div>
        );

      case "logo-left":
      default:
        return (
          <div
            className={`max-w-7xl mx-auto px-6 ${paddingYClass} flex items-center justify-between`}
          >
            <div className="flex items-center gap-3">{renderLogo()}</div>
            <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-650">
              {navigation.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  className="hover:text-blue-600 transition"
                >
                  {link.label}
                </a>
              ))}
              {ctaButton}
              {signInBtn}
            </nav>
          </div>
        );
    }
  };

  return (
    <div className="w-full flex flex-col">
      {headerSettings.announcementBar?.enabled &&
        headerSettings.announcementBar?.text && (
          <a
            href={headerSettings.announcementBar.link || "#"}
            style={{
              backgroundColor:
                headerSettings.announcementBar.bgColor || "#2563eb",
              color: headerSettings.announcementBar.textColor || "#ffffff",
            }}
            className="w-full py-1.5 px-4 text-center text-[10px] font-bold tracking-wide truncate block text-decoration-none z-40 relative"
          >
            {headerSettings.announcementBar.text}
          </a>
        )}

      <header
        className={`${isTransparent ? "absolute w-full bg-transparent" : "bg-white"} ${borderClass} ${shadowClass} z-40 ${isSticky ? "sticky top-0" : "relative"}`}
      >
        {renderHeaderContent()}
      </header>
    </div>
  );
}

// 4. Main Server Catch-All Page Component
export default async function CatchAllPage({ params }) {
  const p = await params;
  const data = await getPageData(p.slug);

  if (!data) {
    return notFound();
  }

  if (data.isBlog) {
    const { post, site, settings } = data;
    const footerSettings = settings?.footer || {};
    const headerMenuType = settings?.header?.menuType || "main";

    const navigation = settings?.navigation?.[headerMenuType] || [];
    // Generate Blog Article JSON-LD
    const articleJsonLd = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt || post.seoDescription || "",
      datePublished: post.publishedAt || post.createdAt,
      dateModified: post.updatedAt,
      author: post.author
        ? {
            "@type": "Person",
            name: post.author.email.split("@")[0],
          }
        : undefined,
      image: post.featuredImage
        ? post.featuredImage.secureUrl || post.featuredImage.url
        : undefined,
    };

    return (
      <div className="min-h-screen bg-slate-50 text-slate-950 flex flex-col justify-between">
        {/* JSON-LD Schema Markup Injection */}
        <Script
          id="article-schema"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(articleJsonLd),
          }}
        />

        {/* Dynamic Header */}
        <PublicHeader site={site} settings={settings} />

        {/* Main Content Area */}
        <main className="grow">
          <BlogPostDetail post={post} site={site} settings={settings} />
        </main>

        {/* Dynamic Footer */}
        <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-white font-bold text-sm mb-4">{site.name}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Powered by the Global Backend Headless CMS. High performance
                modular setups.
              </p>
            </div>
            <div>
              <h5 className="text-white font-bold text-xs mb-3">Links</h5>
              <div className="flex flex-col gap-2 text-xs">
                {(
                  settings?.navigation?.[
                    settings?.header?.menuType || "main"
                  ] || []
                )
                  .slice(0, 4)
                  .map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      className="hover:text-white transition"
                    >
                      {link.label}
                    </a>
                  ))}
              </div>
            </div>
            <div>
              <h5 className="text-white font-bold text-xs mb-3 font-mono">
                Status
              </h5>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-950 px-2 py-0.5 text-[9px] font-bold text-green-400 border border-green-900 uppercase tracking-wider">
                <span className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
                Live & Synced
              </span>
            </div>
            <div>
              <h5 className="text-white font-bold text-xs mb-3">Copyright</h5>
              <p className="text-[10px] text-slate-550 leading-relaxed">
                {footerSettings.copyright ||
                  `© ${new Date().getFullYear()} ${site.name}. All rights reserved.`}
              </p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  const { page, sections, site, settings } = data;
  const footerSettings = settings?.footer || {};

  const headerMenuType = settings?.header?.menuType || "main";

  const navigation = settings?.navigation?.[headerMenuType] || [];
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 flex flex-col justify-between">
      {/* JSON-LD Schema Markup Injection */}
      {page.jsonLd && (
        <Script
          id="page-schema"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(page.jsonLd),
          }}
        />
      )}

      {/* Dynamic Header */}
      <PublicHeader site={site} settings={settings} />

      {/* Main Content Area */}
      <main className="grow">
        {sections.map((s) => {
          const type = String(s.type || "").toUpperCase();
          if (type === "HERO")
            return <HeroSection key={s.id} content={s.content} />;
          if (type === "TEXT_BLOCK")
            return <TextBlockSection key={s.id} content={s.content} />;
          if (type === "SERVICES")
            return <ServicesSection key={s.id} content={s.content} />;
          if (type === "TEAM")
            return <TeamSection key={s.id} content={s.content} />;
          if (type === "TESTIMONIALS")
            return <TestimonialsSection key={s.id} content={s.content} />;
          if (type === "FAQ")
            return <FaqSection key={s.id} content={s.content} />;
          if (type === "CTA")
            return <CtaSection key={s.id} content={s.content} />;
          if (type === "BLOGS")
            return <BlogsSection key={s.id} content={s.content} />;
          if (type === "CONTACT_FORM") {
            return (
              <ContactFormSection
                key={s.id}
                siteId={site.id}
                content={s.content}
                recaptchaSiteKey={
                  settings?.securityControls?.recaptchaSiteKey ||
                  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
                }
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
              Powered by the Global Backend Headless CMS. High performance
              modular setups.
            </p>
          </div>
          <div>
            <h5 className="text-white font-bold text-xs mb-3">Links</h5>
            <div className="flex flex-col gap-2 text-xs">
              {navigation.slice(0, 4).map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  className="hover:text-white transition"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div>
            <h5 className="text-white font-bold text-xs mb-3 font-mono">
              Status
            </h5>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-950 px-2 py-0.5 text-[9px] font-bold text-green-400 border border-green-900 uppercase tracking-wider">
              <span className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
              Live & Synced
            </span>
          </div>
          <div>
            <h5 className="text-white font-bold text-xs mb-3">Copyright</h5>
            <p className="text-[10px] text-slate-550 leading-relaxed">
              {footerSettings.copyright ||
                `© ${new Date().getFullYear()} ${site.name}. All rights reserved.`}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
