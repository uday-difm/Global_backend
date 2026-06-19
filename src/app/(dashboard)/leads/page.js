import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import LeadsManager from "./LeadsManager";

export const metadata = {
  title: "Leads & Contact Forms | CMS Admin",
  description: "Manage contact form submissions, leads pipeline, email settings and spam protection",
};

async function getSiteForUser(user) {
  if (user.globalRole === "SUPERADMIN") {
    return prisma.site.findFirst({ orderBy: { createdAt: "asc" } });
  }
  const membership = await prisma.siteMembership.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: { site: true },
  });
  return membership?.site || null;
}

export default async function LeadsPage() {
  const user = await requireAuth();
  if (!user) return null;

  const site = await getSiteForUser(user);

  if (!site) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Leads & Contact Forms</h1>
        <p className="mt-4 text-sm text-red-600">No active site found. Please configure a site first.</p>
      </div>
    );
  }

  const [submissions, leads, settings] = await Promise.all([
    prisma.contactFormSubmission.findMany({
      where: { siteId: site.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.lead.findMany({
      where: { siteId: site.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.globalSettings.findUnique({
      where: { siteId: site.id },
      select: { emailSettings: true, securityControls: true },
    }),
  ]);

  // Sanitize email settings: never expose password to client
  const emailSettings = settings?.emailSettings
    ? { ...settings.emailSettings, password: settings.emailSettings.password ? "********" : "" }
    : {};

  const initialConfig = {
    emailSettings,
    spamConfig: settings?.securityControls || {},
  };

  return (
    <LeadsManager
      siteId={site.id}
      initialSubmissions={JSON.parse(JSON.stringify(submissions))}
      initialLeads={JSON.parse(JSON.stringify(leads))}
      initialConfig={initialConfig}
    />
  );
}
