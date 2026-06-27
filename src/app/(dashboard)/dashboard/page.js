import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { getSiteForUser } from "@/lib/getSiteForUser";
import StatCard from "@/components/dashboard/StatCard";
import {
  Inbox,
  FileText,
  Newspaper,
  Quote,
  AlertCircle,
  Play,
} from "lucide-react";

export default async function DashboardPage() {
  // Fetch active site context
  const user = await requireAuth();
  const site = await getSiteForUser(user);

  if (!site) {
    return (
      <div className="p-6 text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="p-4 bg-yellow-50 text-yellow-800 border border-yellow-250 rounded-xl text-sm max-w-md mx-auto">
          No active site configuration found. Please seed a site ID in your
          database.
        </div>
      </div>
    );
  }

  // Fetch site-scoped stats
  const totalPages = await prisma.page.count({
    where: { siteId: site.id, deletedAt: null },
  });

  const totalPosts = await prisma.post.count({ where: { siteId: site.id } });
  const totalLeads = await prisma.lead.count({
    where: { siteId: site.id, status: { in: ["new", "contacted"] } },
  });
  const totalTestimonials = await prisma.testimonial.count({
    where: { siteId: site.id, showHide: true },
  });

  // Fetch recent items
  const recentLeads = await prisma.lead.findMany({
    where: { siteId: site.id },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  const recentSubmissions = await prisma.contactFormSubmission.findMany({
    where: { siteId: site.id },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8 w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold md:text-3xl text-gray-950">
          Dashboard
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Overview for:{" "}
          <span className="font-semibold text-gray-800">{site.name}</span> (
          {site.domain || site.id})
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Active Pages" value={totalPages} />
        <StatCard title="Blog Posts" value={totalPosts} />
        <StatCard title="Open CRM Leads" value={totalLeads} />
        <StatCard title="Testimonials (Visible)" value={totalTestimonials} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Recent Leads */}
        <div className="rounded-xl border bg-white p-4 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="mb-4 text-base font-bold text-gray-900 border-b pb-2">
              Recent CRM Leads
            </h2>
            <div className="space-y-3">
              {recentLeads.length === 0 ? (
                <p className="text-xs text-gray-400 italic">
                  No leads registered yet.
                </p>
              ) : (
                recentLeads.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b pb-2 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-gray-900">
                        {item.name}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {item.serviceInterest || "General inquiry"}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        item.status === "new"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-yellow-50 text-yellow-700 border-yellow-250"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t">
            <Link
              href="/leads"
              className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
            >
              View Leads CRM <Play size={10} fill="currentColor" />
            </Link>
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="rounded-xl border bg-white p-4 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="mb-4 text-base font-bold text-gray-900 border-b pb-2">
              Recent Inquiries
            </h2>
            <div className="space-y-3">
              {recentSubmissions.length === 0 ? (
                <p className="text-xs text-gray-400 italic">
                  No inquiries received yet.
                </p>
              ) : (
                recentSubmissions.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-1 border-b pb-2 text-xs"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 italic truncate">
                      "{item.message}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t">
            <Link
              href="/leads"
              className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
            >
              View Inbox Submissions <Play size={10} fill="currentColor" />
            </Link>
          </div>
        </div>

        {/* System & Operations */}
        <div className="rounded-xl border bg-white p-4 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="mb-4 text-base font-bold text-gray-900 border-b pb-2">
              System Integrations
            </h2>
            <div className="space-y-3 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span>PostgreSQL DB Connected</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span>Cloudinary Connected</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
                <span>
                  Local Server:{" "}
                  <span className="font-mono bg-gray-100 px-1 rounded">
                    Dev Bypass
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t space-y-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Operations Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-center font-semibold">
              <Link
                href="/backup"
                className="border rounded-lg py-2.5 px-1 hover:bg-gray-50 transition truncate"
              >
                Backup
              </Link>
              <Link
                href="/redirects"
                className="border rounded-lg py-2.5 px-1 hover:bg-gray-50 transition truncate"
              >
                Link Auditor
              </Link>
              <Link
                href="/faq"
                className="border rounded-lg py-2.5 px-1 hover:bg-gray-50 transition truncate"
              >
                FAQ Editor
              </Link>
              <Link
                href="/testimonials"
                className="border rounded-lg py-2.5 px-1 hover:bg-gray-50 transition truncate"
              >
                Reviews
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
