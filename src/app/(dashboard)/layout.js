import { redirect } from "next/navigation";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import { requireAuth } from "@/lib/requireAuth";

export default async function Layout({ children }) {
  const user = await requireAuth();

  if (!user) {
    redirect("/");
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
