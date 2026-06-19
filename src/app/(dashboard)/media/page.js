import prisma from "@/lib/prisma";
import MediaLibraryClient from "./MediaLibraryClient";

export default async function MediaPage() {
  const site = await prisma.site.findFirst({ where: { isActive: true } });

  if (!site) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Media Library</h1>
        <p className="mt-4 text-sm text-red-600">No active site found. Please configure a site in the database.</p>
      </div>
    );
  }

  return <MediaLibraryClient siteId={site.id} />;
}
