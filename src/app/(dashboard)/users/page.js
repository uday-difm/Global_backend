// src/app/(dashboard)/users/page.js
import React from "react";
import prisma from "@/lib/prisma";
import CreateUserForm from "./CreateUserForm";
import PublishToggle from "../pages/PublishToggle"; // reuse if you want or remove
import UserDetailModal from "./UserDetailModal";
import DeleteUserButton from "./DeleteUserButton";

/*
 Admin Users list (server component)
 Shows list of users and provides Create button. Edit opens modal via client-side action.
*/

import { requireAuth } from "@/lib/requireAuth";
import { redirect } from "next/navigation";

export default async function UsersPage() {
  const sessionUser = await requireAuth();

  if (!sessionUser) {
    redirect("/login");
  }

  if (sessionUser.globalRole !== "SUPERADMIN" && sessionUser.globalRole !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch users server-side
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      globalRole: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Admin Users</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage global users and roles
          </p>
        </div>
        <CreateUserForm />
      </div>

      <div className="bg-white shadow rounded">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Active
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {u.email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {u.globalRole}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {u.isActive ? (
                    <span className="text-green-600">Active</span>
                  ) : (
                    <span className="text-red-600">Disabled</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(u.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <UserDetailModal userId={u.id} />
                  <DeleteUserButton userId={u.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="p-6 text-sm text-gray-500">No users found.</div>
        )}
      </div>
    </div>
  );
}
