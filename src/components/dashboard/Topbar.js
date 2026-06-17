"use client";

import { Search, Bell, UserCircle } from "lucide-react";

export default function Topbar() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-white px-6">
      {/* Left */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>

        <p className="text-sm text-gray-500">Manage your website content</p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search..."
            className="w-64 rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-black"
          />
        </div>

        {/* Notifications */}
        <button className="rounded-lg p-2 transition hover:bg-gray-100">
          <Bell size={18} />
        </button>

        {/* User */}
        <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
          <UserCircle size={22} />

          <div className="hidden sm:block">
            <p className="text-sm font-medium">Admin</p>

            <p className="text-xs text-gray-500">Super Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}
