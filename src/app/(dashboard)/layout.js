import { redirect } from "next/navigation";
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

  return <DashboardLayout siteId={siteId}>{children}</DashboardLayout>;
}
