// src/app/pages/[pageId]/edit/page.js
import PageEditorClient from "@/app/(dashboard)/pages/[pageId]/edit/pageEditorClient"; // adjust import path if your client lives elsewhere
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

function resolveFrontendUrlForRequest(value, requestHost) {
  const fallback = "http://localhost:3001";
  const raw = (value || fallback).trim();
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;

  try {
    const url = new URL(withProtocol);
    const hostname = requestHost?.split(":")[0];
    const isLocalPreviewHost =
      url.hostname === "localhost" || url.hostname === "127.0.0.1";
    const isLanRequestHost =
      hostname && hostname !== "localhost" && hostname !== "127.0.0.1";

    if (isLocalPreviewHost && isLanRequestHost) {
      url.hostname = hostname;
    }

    return url.href.replace(/\/+$/, "");
  } catch {
    return withProtocol.replace(/\/+$/, "");
  }
}

export default async function PageEditorPage({ params }) {
  const { pageId } = await params;

  if (!pageId) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Page Editor — Missing pageId</h1>
        <p>
          Use /pages/[pageId]/edit or include ?pageId=&lt;id&gt; to open the
          editor.
        </p>
      </div>
    );
  }

  const page = await prisma.page.findFirst({
    where: { id: pageId, deletedAt: null },
    select: { id: true, title: true, slug: true, siteId: true },
  });

  if (!page) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Page Editor</h1>
        <p>Page not found for id: {pageId}</p>
      </div>
    );
  }

  const settings = await prisma.globalSettings.findUnique({
    where: { siteId: page.siteId },
    select: { websiteSettings: true },
  });
  const requestHeaders = await headers();
  const frontendUrl = resolveFrontendUrlForRequest(
    settings?.websiteSettings?.domain || process.env.FRONTEND_URL,
    requestHeaders.get("host"),
  );

  // render the client editor and pass siteId
  return (
    <PageEditorClient
      pageId={page.id}
      siteId={page.siteId}
      pageTitle={page.title}
      frontendUrl={frontendUrl}
    />
  );
}
