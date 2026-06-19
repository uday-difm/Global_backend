"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, Search, Bell, UserCircle, LogOut, ChevronDown } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export default function Topbar() {
  const [showSearch, setShowSearch] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { data: session } = useSession();

  const userEmail = session?.user?.email ?? "Admin";
  const userRole = session?.user?.globalRole ?? "—";

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setMenuOpen(false);
    await signOut({ callbackUrl: "/" });
  }

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

            {/* User menu */}
            <div className="relative" ref={menuRef}>
              <button
                id="user-menu-btn"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg border px-2 py-2 transition hover:bg-gray-50 sm:px-3"
              >
                <UserCircle size={22} className="text-gray-600 shrink-0" />

                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium text-gray-900 leading-tight max-w-[140px] truncate">
                    {userEmail}
                  </p>
                  <p className="text-xs text-gray-500">{userRole}</p>
                </div>

                <ChevronDown
                  size={14}
                  className={`hidden lg:block text-gray-400 transition-transform ${
                    menuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl border bg-white shadow-lg overflow-hidden z-50">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b bg-gray-50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Signed in as
                    </p>
                    <p className="text-sm font-medium text-gray-900 truncate mt-0.5">
                      {userEmail}
                    </p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                      {userRole}
                    </span>
                  </div>

                  {/* Logout */}
                  <button
                    id="logout-btn"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={15} />
                    Sign out
                  </button>
                </div>
              )}
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
