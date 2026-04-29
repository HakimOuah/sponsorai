"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="app-workspace relative flex min-h-screen overflow-x-hidden bg-[#020403] text-[#F8FAF7]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_24%_0%,rgba(62,242,160,0.12),transparent_28%),radial-gradient(circle_at_92%_18%,rgba(0,107,85,0.16),transparent_34%),linear-gradient(180deg,#020403_0%,#050A0D_100%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.055] [background-image:linear-gradient(to_right,#F8FAF7_1px,transparent_1px),linear-gradient(to_bottom,#F8FAF7_1px,transparent_1px)] [background-size:84px_84px]" />

      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onCollapseToggle={() => setSidebarCollapsed((value) => !value)}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div
        className={cn(
          "relative z-10 flex min-w-0 flex-1 flex-col transition-[padding] duration-300",
          sidebarCollapsed ? "lg:pl-16" : "lg:pl-60"
        )}
      >
        <TopBar onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="min-w-0 flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
