import Link from "next/link";
import prisma from "@/lib/prisma";
import DeleteServiceButton from "./DeleteServiceButton";

export default async function ServicesAdmin() {
  // Fetch the first active site, consistent with other admin pages
  const site = await prisma.site.findFirst({ where: { isActive: true } });

  if (!site) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Services</h1>
        <p className="mt-4 text-sm text-red-600">No active site found.</p>
      </div>
    );
  }

  const services = await prisma.service.findMany({
    where: { siteId: site.id },
    orderBy: { sortOrder: "asc" }, // Order by sortOrder
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Services</h1>
          <div className="text-sm text-slate-500 mt-1">
            Site: {site.name} ({site.domain || site.id})
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/services/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Create New Service
          </Link>
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
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Updated
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y">
            {services.map((service) => (
              <tr key={service.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {service.title}
                  </div>
                  <div className="text-sm text-gray-500">
                    Order: {service.sortOrder}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {service.price || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      service.status === "ACTIVE"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {service.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(service.updatedAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <Link
                    href={`/services/${service.id}/edit`}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
                  >
                    Edit
                  </Link>
                  <DeleteServiceButton serviceId={service.id} siteId={site.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {services.length === 0 && (
          <div className="p-6 text-sm text-gray-500">
            No services found for this site.
          </div>
        )}
      </div>
    </div>
  );
}
