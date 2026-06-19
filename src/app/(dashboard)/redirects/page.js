import prisma from "@/lib/prisma";
import RedirectsManager from "./RedirectsManager";

export default async function RedirectsPage() {
  const site = await prisma.site.findFirst({ where: { isActive: true } });

  if (!site) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Redirect rules</h1>
        <p className="mt-4 text-sm text-red-600">No active site found. Please configure a site in the database.</p>
      </div>
    );
  }

  // Pre-load redirect rules
  const redirects = await prisma.redirect.findMany({
    where: { siteId: site.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">URLs & Redirect Rules</h1>
        <p className="text-sm text-gray-500 mt-1">
          Site: <span className="font-medium text-gray-800">{site.name}</span> ({site.domain || site.id})
        </p>
      </div>

      <RedirectsManager
        siteId={site.id}
        initialRedirects={JSON.parse(JSON.stringify(redirects))}
      />
    </div>
  );
}
