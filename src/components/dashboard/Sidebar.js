"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
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
  PanelTop,
  ShieldCheck,
  Phone,
  Megaphone,
  BarChart2,
  Scale,
  Menu,
  Mail,
  Activity,
  Bell,
  Fingerprint,
  Terminal,
} from "lucide-react";


// Role hierarchy: higher number = more access
const ROLE_LEVEL = {
  SUPERADMIN: 5,
  ADMIN: 4,
  EDITOR: 3,
  AUTHOR: 2,
  VIEWER: 1,
};

/**
 * minRole: the minimum globalRole level required to see this link.
 *   "VIEWER" (1)  = everyone
 *   "AUTHOR" (2)  = AUTHOR, EDITOR, ADMIN, SUPERADMIN
 *   "EDITOR" (3)  = EDITOR, ADMIN, SUPERADMIN
 *   "ADMIN"  (4)  = ADMIN, SUPERADMIN only
 *   "SUPERADMIN" (5) = SUPERADMIN only
 */
const sections = [
  {
    title: "Overview",
    links: [
      { href: "/dashboard",  label: "Dashboard",         icon: LayoutDashboard, minRole: "VIEWER"     },
      { href: "/leads",      label: "Leads CRM",         icon: Inbox,           minRole: "EDITOR"     },
      { href: "/visitors",   label: "Visitor Analytics", icon: BarChart2,       minRole: "VIEWER"     },
      { href: "/media",      label: "Media Library",     icon: ImageIcon,       minRole: "AUTHOR"     },
    ],
  },
  {
    title: "Content",
    links: [
      { href: "/pages",        label: "Pages",           icon: FileText,      minRole: "EDITOR" },
      { href: "/blogs",        label: "Blogs",           icon: Newspaper,     minRole: "AUTHOR" },
      { href: "/services",     label: "Services",        icon: Briefcase,     minRole: "EDITOR" },
      { href: "/testimonials", label: "Testimonials",    icon: Quote,         minRole: "EDITOR" },
      { href: "/faq",          label: "FAQs",            icon: HelpCircle,    minRole: "EDITOR" },
      { href: "/team",         label: "Team Members",    icon: UsersRound,    minRole: "EDITOR" },
      { href: "/contact",      label: "Contact Details", icon: Phone,         minRole: "EDITOR" },
      { href: "/legal",        label: "Legal Pages",     icon: Scale,         minRole: "EDITOR" },
      { href: "/navigation",   label: "Navigation Menus",icon: Menu,          minRole: "EDITOR" },
      { href: "/header",       label: "Header Builder",  icon: PanelTop,      minRole: "ADMIN"  },
      { href: "/footer",       label: "Footer Builder",  icon: PanelBottom,   minRole: "ADMIN"  },
      { href: "/cta",          label: "CTA & Popups",    icon: Megaphone,     minRole: "ADMIN"  },
    ],
  },
  {
    title: "System Config",
    links: [
      { href: "/redirects", label: "Redirect Rules",   icon: ArrowLeftRight, minRole: "ADMIN"      },
      { href: "/backup",    label: "Backup & Restore",  icon: Database,       minRole: "SUPERADMIN" },
      { href: "/security",  label: "Security Center",   icon: ShieldCheck,    minRole: "ADMIN"      },
      { href: "/compliance", label: "Compliance & GDPR", icon: Fingerprint,   minRole: "ADMIN"      },
      { href: "/dev",        label: "Developer Tools",   icon: Terminal,      minRole: "ADMIN"      },
      { href: "/performance", label: "Performance & Logs", icon: Activity, minRole: "ADMIN"      },
      { href: "/notifications", label: "Notifications", icon: Bell,           minRole: "ADMIN"      },
      { href: "/email",     label: "Email Settings",    icon: Mail,           minRole: "ADMIN"      },
      { href: "/settings",  label: "Settings",          icon: Settings,       minRole: "ADMIN"      },
      { href: "/users",     label: "Users",             icon: Users,          minRole: "ADMIN"      },
    ],
  },
];

function canSee(userRole, minRole) {
  return (ROLE_LEVEL[userRole] || 0) >= (ROLE_LEVEL[minRole] || 0);
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.globalRole || "VIEWER";

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:bg-white">
      {/* Sidebar Header */}
      <div className="border-b px-5 py-4">
        <h1 className="text-lg font-bold text-gray-950 tracking-tight">Global CMS</h1>
        <p className="text-xs text-gray-500 font-medium">Administration Console</p>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {sections.map((section) => {
          const visibleLinks = section.links.filter((link) =>
            canSee(userRole, link.minRole)
          );
          if (visibleLinks.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1">
              <h5 className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {section.title}
              </h5>
              <ul className="space-y-0.5">
                {visibleLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive =
                    pathname === link.href ||
                    (link.href !== "/dashboard" && pathname.startsWith(link.href));
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          isActive
                            ? "bg-gray-100 text-gray-950"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-950"
                        }`}
                      >
                        <Icon
                          size={15}
                          className={`shrink-0 ${isActive ? "text-gray-950" : "text-gray-400"}`}
                        />
                        <span className="truncate">{link.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t px-5 py-3.5 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-gray-400 font-mono tracking-tight">
            V1.0.2 • Multi-Site
          </p>
          {/* Role badge */}
          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-600 uppercase tracking-wide">
            {userRole}
          </span>
        </div>
      </div>
    </aside>
  );
}
