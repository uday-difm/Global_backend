import prisma from "@/lib/prisma";
import SettingsEditor from "./SettingsEditor";

export default async function SettingsPage() {
  // Fetch the first active site, consistent with other admin pages
  const site = await prisma.site.findFirst({ where: { isActive: true } });

  if (!site) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-4 text-sm text-red-600">No active site found.</p>
      </div>
    );
  }

  // Fetch the existing settings for this site, if they exist
  const settings = await prisma.globalSettings.findUnique({
    where: { siteId: site.id },
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Global Website Settings</h1>
        <div className="text-sm text-slate-500 mt-1">
          Site: {site.name} ({site.domain || site.id})
        </div>
      </div>

      {/*
        The SettingsEditor is a client component that handles all state and API calls.
        We pass the initial data fetched on the server as a prop.
      */}
      <SettingsEditor siteId={site.id} initialSettings={settings} />
    </div>
  );
}
