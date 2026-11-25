"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/ui";
import { Backdrop } from "./backdrop";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { CommandPalette } from "./command-palette";
import { DetailDrawer } from "@/components/vespera/detail-drawer";

export function AppShell({ children }: { children: React.ReactNode }) {
  const collapsed = useSidebarStore((s) => s.collapsed);
  const pathname = usePathname();
  return (
    <div className="relative min-h-screen">
      <Backdrop />
      <Sidebar />
      <div
        className={cn(
          "relative z-[1] flex min-h-screen flex-col transition-[padding] duration-200 ease-out",
          collapsed ? "lg:pl-[72px]" : "lg:pl-[248px]",
        )}
      >
        <Topbar />
        <main className="vs-safe-x flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div key={pathname} className="vs-page-enter mx-auto w-full max-w-[1440px]">
            {children}
          </div>
        </main>
      </div>
      <CommandPalette />
      <DetailDrawer />
    </div>
  );
}
