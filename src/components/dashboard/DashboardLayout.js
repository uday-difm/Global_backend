"use client";

import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";

export default function DashboardLayout({ children, siteId, sites = [] }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50 text-black">
      {/* 1. Pass down open state and the ability to close itself to the Sidebar */}
      <Sidebar
        siteId={siteId}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* 2. Pass down a toggle trigger handler to the Topbar menu button */}
        <Topbar
          siteId={siteId}
          sites={sites}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
