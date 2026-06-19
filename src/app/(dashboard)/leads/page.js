import prisma from "@/lib/prisma";
import LeadsManager from "./LeadsManager";

export default async function LeadsPage() {
  const site = await prisma.site.findFirst({ where: { isActive: true } });

  if (!site) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Leads & Submissions CRM</h1>
        <p className="mt-4 text-sm text-red-600">No active site found. Please configure a site in the database.</p>
      </div>
    );
  }

  const submissions = await prisma.contactFormSubmission.findMany({
    where: { siteId: site.id },
    orderBy: { createdAt: "desc" },
  });

  const leads = await prisma.lead.findMany({
    where: { siteId: site.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Leads & Submissions CRM</h1>
        <p className="text-sm text-gray-500 mt-1">
          Site: <span className="font-medium text-gray-800">{site.name}</span> ({site.domain || site.id})
        </p>
      </div>

      <LeadsManager
        siteId={site.id}
        initialSubmissions={JSON.parse(JSON.stringify(submissions))}
        initialLeads={JSON.parse(JSON.stringify(leads))}
      />
    </div>
  );
}
