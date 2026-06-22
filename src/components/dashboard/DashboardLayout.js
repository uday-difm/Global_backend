import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";

export default function DashboardLayout({ children, siteId }) {
  return (
    <div className="flex min-h-screen bg-gray-50 text-black">
      <Sidebar siteId={siteId} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar siteId={siteId} />

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
