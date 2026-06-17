"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  ImageIcon,
  FileText,
  Newspaper,
  Briefcase,
  Settings,
} from "lucide-react";

export default function Sidebar() {
  const links = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/media",
      label: "Media Library",
      icon: ImageIcon,
    },
    {
      href: "/pages",
      label: "Pages",
      icon: FileText,
    },
    {
      href: "/blogs",
      label: "Blogs",
      icon: Newspaper,
    },
    {
      href: "/services",
      label: "Services",
      icon: Briefcase,
    },
    {
      href: "/settings",
      label: "Settings",
      icon: Settings,
    },
  ];

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:bg-white">
      <div className="border-b p-6">
        <h1 className="text-xl font-bold text-black">Global CMS</h1>

        <p className="mt-1 text-sm text-gray-500">Admin Panel</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {links.map((link) => {
            const Icon = link.icon;

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-black"
                >
                  <Icon size={18} />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t p-4">
        <p className="text-xs text-gray-500">Global Backend CMS</p>
      </div>
    </aside>
  );
}
