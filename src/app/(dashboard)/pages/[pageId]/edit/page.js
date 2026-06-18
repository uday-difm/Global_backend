// src/app/pages/[pageId]/edit/page.js
import PageEditorClient from "@/app/(dashboard)/pages/[pageId]/edit/pageEditorClient"; // adjust import path if your client lives elsewhere
import prisma from "@/lib/prisma";

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

  const page = await prisma.page.findUnique({
    where: { id: pageId },
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

  // render the client editor and pass siteId
  return (
    <PageEditorClient
      pageId={page.id}
      siteId={page.siteId}
      pageTitle={page.title}
    />
  );
}
