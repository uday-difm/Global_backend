import prisma from "@/lib/prisma";
import FaqManager from "./FaqManager";

export default async function FaqPage() {
  const site = await prisma.site.findFirst({ where: { isActive: true } });

  if (!site) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">FAQs</h1>
        <p className="mt-4 text-sm text-red-600">No active site found. Please configure a site in the database.</p>
      </div>
    );
  }

  const faqs = await prisma.faq.findMany({
    where: { siteId: site.id },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Frequently Asked Questions (FAQs)</h1>
        <p className="text-sm text-gray-500 mt-1">
          Site: <span className="font-medium text-gray-800">{site.name}</span> ({site.domain || site.id})
        </p>
      </div>

      <FaqManager
        siteId={site.id}
        initialFaqs={JSON.parse(JSON.stringify(faqs))}
      />
    </div>
  );
}
