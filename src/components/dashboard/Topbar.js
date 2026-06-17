"use client";

import { useState } from "react";
import { Menu, Search, Bell, UserCircle } from "lucide-react";

export default function Topbar() {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <>
      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b bg-white">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          {/* Left */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button className="rounded-lg p-2 hover:bg-gray-100 md:hidden">
              <Menu size={20} />
            </button>

            <div>
              <h1 className="text-lg font-semibold text-gray-900 md:text-xl">
                Admin Panel
              </h1>

              <p className="hidden text-sm text-gray-500 sm:block">
                Manage your website content
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Desktop Search */}
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

            {/* Mobile Search Toggle */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="rounded-lg p-2 transition hover:bg-gray-100 md:hidden"
            >
              <Search size={18} />
            </button>

            {/* Notifications */}
            <button className="rounded-lg p-2 transition hover:bg-gray-100">
              <Bell size={18} />
            </button>

            {/* User */}
            <div className="flex items-center gap-2 rounded-lg border px-2 py-2 sm:px-3">
              <UserCircle size={22} />

              <div className="hidden lg:block">
                <p className="text-sm font-medium">Admin</p>

                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {showSearch && (
          <div className="border-t bg-white p-3 md:hidden">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                placeholder="Search..."
                className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-black"
              />
            </div>
          </div>
        )}
      </header>
    </>
  );
}
