// global_backend/src/app/(dashboard)/pages/page.js
import Link from "next/link";
import prisma from "@/lib/prisma";
import CreatePageForm from "./CreatePageForm";
import PublishToggle from "./PublishToggle";
import DeletePageButton from "./DeletePageButton";

/**
 * Pages admin list (server component)
 *
 * Server component must NOT pass functions to client components.
 * Interactive actions (publish toggle) are handled by a client component PublishToggle.
 */

export default async function PagesAdmin() {
  const site = await prisma.site.findFirst({ where: { isActive: true } });
  if (!site) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Pages</h1>
        <p className="mt-4 text-sm text-red-600">No active site found in DB.</p>
      </div>
    );
  }

  const pages = await prisma.page.findMany({
    where: { siteId: site.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Pages</h1>
          <div className="text-sm text-slate-500 mt-1">
            Site: {site.name} ({site.domain || site.id})
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CreatePageForm siteId={site.id} />
        </div>
      </div>

      <div className="bg-white shadow rounded">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Updated
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y">
            {pages.map((p) => (
              <tr key={p.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {p.title}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {p.slug}
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      p.status === "PUBLISHED"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(p.updatedAt).toLocaleString()}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <Link
                    href={`/pages/${p.id}/edit`}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
                  >
                    Edit
                  </Link>

                  {/* Preview as plain anchor (no JS handler passed) */}
                  <a
                    href={`/preview?pageId=${encodeURIComponent(p.id)}&siteId=${encodeURIComponent(site.id)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 bg-emerald-600 text-white rounded text-xs"
                  >
                    Preview
                  </a>

                  {/* Publish toggle: client component; only primitive props passed */}
                  <PublishToggle pageId={p.id} initialStatus={p.status} siteId={site.id} />

                  {/* Delete button: client component */}
                  <DeletePageButton pageId={p.id} siteId={site.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {pages.length === 0 && (
          <div className="p-6 text-sm text-gray-500">
            No pages found for this site.
          </div>
        )}
      </div>
    </div>
  );
}
