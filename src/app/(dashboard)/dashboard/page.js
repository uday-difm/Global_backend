import Link from "next/link";

import prisma from "@/lib/prisma";
import StatCard from "@/components/dashboard/StatCard";

export default async function DashboardPage() {
  const totalUsers = await prisma.user.count();
  const totalMedia = await prisma.media.count();
  const totalSites = await prisma.site.count();

  const recentMedia = await prisma.media.findMany({
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
  });

  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-8 w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Dashboard</h1>

        <p className="text-gray-500">Welcome to Global CMS</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Users" value={totalUsers} />

        <StatCard title="Media Files" value={totalMedia} />

        <StatCard title="Sites" value={totalSites} />

        <StatCard title="Storage" value={`${totalMedia} Files`} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Media */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Recent Media</h2>

          <div className="space-y-3">
            {recentMedia.length === 0 ? (
              <p className="text-sm text-gray-500">No media uploaded yet</p>
            ) : (
              recentMedia.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-1 border-b pb-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="truncate text-sm">{item.fileName}</span>

                  <span className="text-xs text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">System Status</h2>

          <div className="space-y-3">
            <p>🟢 Database Connected</p>
            <p>🟢 Cloudinary Connected</p>
            <p>🟢 Development Environment</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Link
              href="/media"
              className="rounded-lg border p-3 transition hover:bg-gray-50"
            >
              Upload Media
            </Link>

            <Link
              href="/users"
              className="rounded-lg border p-3 transition hover:bg-gray-50"
            >
              Manage Users
            </Link>

            <Link
              href="/pages"
              className="rounded-lg border p-3 transition hover:bg-gray-50"
            >
              Create Page
            </Link>

            <Link
              href="/blogs"
              className="rounded-lg border p-3 transition hover:bg-gray-50"
            >
              Create Blog
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Recent Users</h2>

        {recentUsers.length === 0 ? (
          <p className="text-sm text-gray-500">No users found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-20 w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Created</th>
                </tr>
              </thead>

              <tbody>
                {recentUsers.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="py-3">{user.email}</td>

                    <td className="py-3">{user.globalRole}</td>

                    <td className="py-3">
                      {user.isActive ? (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">
                          Disabled
                        </span>
                      )}
                    </td>

                    <td className="py-3">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
