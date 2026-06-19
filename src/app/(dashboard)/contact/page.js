import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import ContactDetailsEditor from "./ContactDetailsEditor";

export const metadata = {
  title: "Contact Details | CMS Admin",
  description: "Manage business contact information, business hours and social links",
};

async function getSiteId(user) {
  // Get the first site the user has access to
  if (user.globalRole === "SUPERADMIN") {
    const site = await prisma.site.findFirst({ orderBy: { createdAt: "asc" } });
    return site?.id || null;
  }
  const membership = await prisma.siteMembership.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  return membership?.siteId || null;
}

export default async function ContactPage() {
  const user = await requireAuth();
  if (!user) return null;

  const siteId = await getSiteId(user);

  let initialData = null;
  if (siteId) {
    const settings = await prisma.globalSettings.findUnique({
      where: { siteId },
      select: { contactDetails: true },
    });
    initialData = settings?.contactDetails || null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <ContactDetailsEditor siteId={siteId} initialData={initialData} />
    </div>
  );
}
