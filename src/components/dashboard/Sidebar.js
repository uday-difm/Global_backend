"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  ImageIcon,
  FileText,
  Newspaper,
  Briefcase,
  Settings,
  Users,
  Inbox,
  Quote,
  HelpCircle,
  UsersRound,
  Database,
  ArrowLeftRight,
  PanelBottom,
} from "lucide-react";

export default function Sidebar() {
  const sections = [
    {
      title: "Overview",
      links: [
        {
          href: "/dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
        },
        {
          href: "/leads",
          label: "Leads CRM",
          icon: Inbox,
        },
        {
          href: "/media",
          label: "Media Library",
          icon: ImageIcon,
        },
      ],
    },
    {
      title: "Content",
      links: [
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
          href: "/testimonials",
          label: "Testimonials",
          icon: Quote,
        },
        {
          href: "/faq",
          label: "FAQs",
          icon: HelpCircle,
        },
        {
          href: "/team",
          label: "Team Members",
          icon: UsersRound,
        },
        {
          href: "/footer",
          label: "Footer Builder",
          icon: PanelBottom,
        },
      ],
    },
    {
      title: "System Config",
      links: [
        {
          href: "/redirects",
          label: "Redirect rules",
          icon: ArrowLeftRight,
        },
        {
          href: "/backup",
          label: "Backup & Restore",
          icon: Database,
        },
        {
          href: "/settings",
          label: "Settings",
          icon: Settings,
        },
        {
          href: "/users",
          label: "Users",
          icon: Users,
        },
      ],
    },
  ];

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:bg-white">
      {/* Sidebar Header */}
      <div className="border-b px-5 py-4">
        <h1 className="text-lg font-bold text-gray-950 tracking-tight">Global CMS</h1>
        <p className="text-xs text-gray-500 font-medium">Administration Console</p>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            <h5 className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {section.title}
            </h5>
            <ul className="space-y-0.5">
              {section.links.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 hover:text-gray-950"
                    >
                      <Icon size={15} className="text-gray-400 group-hover:text-gray-950 shrink-0" />
                      <span className="truncate">{link.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t px-5 py-3.5 bg-gray-50/50">
        <p className="text-[10px] text-gray-400 font-mono tracking-tight text-center">
          V1.0.2 • Multi-Site
        </p>
      </div>
    </aside>
  );
}
