import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import { requireAuth } from "@/lib/requireAuth";
import { getSiteForUser } from "@/lib/getSiteForUser";

export default async function Layout({ children }) {
  const user = await requireAuth();

  if (!user) {
    redirect("/");
  }

  const site = await getSiteForUser(user);
  const siteId = site ? site.id : null;

  // Fetch list of accessible sites for the workspace picker
  let sites = [];
  const isSuper = user.globalRole === "SUPERADMIN" || user.globalRole === "ADMIN";
  if (isSuper) {
    sites = await prisma.site.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    });
  } else {
    const memberships = await prisma.siteUser.findMany({
      where: { userId: user.id, site: { deletedAt: null, isActive: true } },
      include: { site: { select: { id: true, name: true } } },
      orderBy: { site: { name: "asc" } }
    });
    sites = memberships.map(m => m.site).filter(Boolean);
  }

  return (
    <DashboardLayout siteId={siteId} sites={sites}>
      {children}
    </DashboardLayout>
  );
}
