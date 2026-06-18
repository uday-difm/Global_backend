// src/app/preview/page.js
import React from "react";
import Image from "next/image";
import prisma from "@/lib/prisma";

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
          <Image
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
            <Image
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

  // Fetch page and sections directly with Prisma
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

  let sections = await prisma.section.findMany({
    where: { pageId: page.id },
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

  // Inject URLs into section.content for preview rendering
  sections = sections.map((s) => {
    const content = { ...(s.content || {}) };
    if (content.bannerMediaId && mediaMap[content.bannerMediaId]) {
      content.bannerUrl = mediaMap[content.bannerMediaId];
    }
    if (content.imageMediaId && mediaMap[content.imageMediaId]) {
      content.imageUrl = mediaMap[content.imageMediaId];
    }
    return { ...s, content };
  });

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="bg-white border-b">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-500">Previewing</div>
            <div className="text-lg font-semibold">
              {page.title || page.slug}
            </div>
            <div className="text-xs text-slate-400">
              {page.status || "unknown status"}
            </div>
          </div>
          <div>
            <a href="/" className="text-sm text-blue-600">
              Open site
            </a>
          </div>
        </div>
      </header>

      <main>
        {sections
          .filter((s) => s.isVisible !== false)
          .map((s) => {
            const type = String(s.type || "").toUpperCase();
            if (type === "HERO") return <Hero key={s.id} content={s.content} />;
            if (type === "TEXT_BLOCK")
              return <TextBlock key={s.id} content={s.content} />;
            return (
              <section key={s.id} className="container mx-auto px-6 py-8">
                <h3 className="font-medium mb-2">{s.type}</h3>
                <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(s.content, null, 2)}
                </pre>
              </section>
            );
          })}
      </main>

      <footer className="border-t py-6 mt-12">
        <div className="container mx-auto px-6 text-sm text-slate-500">
          Preview mode — draft content may be shown
        </div>
      </footer>
    </div>
  );
}
