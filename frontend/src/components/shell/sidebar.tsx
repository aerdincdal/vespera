"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronsLeft, ChevronsRight } from "lucide-react";
import { NAV_GROUPS } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/ui";
import { Wordmark } from "./logo";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function SidebarNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const closedGroups = useSidebarStore((s) => s.closedGroups);
  const toggleGroup = useSidebarStore((s) => s.toggleGroup);
  const clean = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return (
    <nav className="vs-nav-scroll min-h-0 flex-1 overflow-y-auto px-3 py-2" aria-label="Ana menü">
      {NAV_GROUPS.map((group) => {
        const hasActive = group.items.some((i) => i.href === clean);
        // the group holding the current page never folds shut, so the user always sees where they are
        const open = collapsed || hasActive || !closedGroups.includes(group.title);
        const listId = `nav-${group.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
        return (
          <div key={group.title} className="mb-2">
            {!collapsed ? (
              <button
                type="button"
                onClick={() => toggleGroup(group.title)}
                aria-expanded={open}
                aria-controls={listId}
                className="eyebrow group/hd flex w-full items-center justify-between rounded-lg px-3 pb-2 pt-3 text-left transition-colors hover:text-sand-200"
              >
                <span>{group.title}</span>
                <ChevronDown
                  size={13}
                  strokeWidth={1.75}
                  className={cn("text-sand-200/40 transition-transform duration-200 group-hover/hd:text-sand-200/80", !open && "-rotate-90")}
                  aria-hidden
                />
              </button>
            ) : (
              <div className="mx-3 my-3 h-px bg-line" aria-hidden />
            )}
            <div id={listId} className="vs-fold" data-open={open ? "1" : "0"}>
              <ul className="space-y-0.5 pb-2">
                {group.items.map((item) => {
                  const active = clean === item.href;
                  const Icon = item.icon;
                  const link = (
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      tabIndex={open ? undefined : -1}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] transition-colors duration-150 max-lg:py-2.5 max-lg:text-[14.5px]",
                        "text-sand-100/80 hover:bg-white/[0.04] hover:text-sand-50",
                        active && "bg-[rgba(196,178,141,0.14)] text-sand-50 shadow-[inset_0_0_0_1px_rgba(196,178,141,0.12),inset_0_0_18px_rgba(196,178,141,0.06)]",
                        collapsed && "justify-center px-0",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r bg-sand-300 opacity-0 transition-opacity",
                          active && "opacity-100",
                        )}
                      />
                      <Icon
                        size={18}
                        strokeWidth={1.5}
                        className={cn("shrink-0 text-sand-200/85 transition-colors", active && "text-sand-300")}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                  return (
                    <li key={item.href}>
                      {collapsed ? (
                        <Tooltip>
                          <TooltipTrigger render={<span className="block" />}>{link}</TooltipTrigger>
                          <TooltipContent side="right">{item.label}</TooltipContent>
                        </Tooltip>
                      ) : (
                        link
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggle = useSidebarStore((s) => s.toggle);
  return (
    <aside
      className={cn(
        "hidden lg:flex fixed inset-y-0 left-0 z-30 flex-col border-r border-line",
        "bg-[linear-gradient(180deg,rgba(16,32,58,0.85),rgba(11,21,40,0.9))] backdrop-blur-xl",
        "transition-[width] duration-200 ease-out",
        collapsed ? "w-[72px]" : "w-[248px]",
      )}
    >
      <div className={cn("flex h-16 items-center border-b border-line px-5", collapsed && "justify-center px-0")}>
        <Link href="/dashboard" aria-label="VESPERA ana sayfa">
          <Wordmark compact={collapsed} />
        </Link>
      </div>
      <div className="vs-nav-mask relative flex min-h-0 flex-1 flex-col">
        <SidebarNav collapsed={collapsed} />
      </div>
      <div className={cn("flex items-center border-t border-line px-4 py-3", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && <span className="text-[11px] text-ink-muted">© 2026 App On Inc.</span>}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
          className="rounded-lg p-1.5 text-sand-200/70 transition-colors hover:bg-white/[0.05] hover:text-sand-50"
        >
          {collapsed ? <ChevronsRight size={16} strokeWidth={1.5} /> : <ChevronsLeft size={16} strokeWidth={1.5} />}
        </button>
      </div>
    </aside>
  );
}
