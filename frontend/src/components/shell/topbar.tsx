"use client";

import { Menu, Search, Settings, WifiOff } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOfflineStore, useSidebarStore } from "@/store/ui";
import { findNav } from "@/lib/nav";
import { IS_DEMO } from "@/lib/api";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar";
import { Monogram, Wordmark } from "./logo";
import { NotificationCenter } from "./notification-center";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function Topbar() {
  const pathname = usePathname();
  const current = findNav(pathname);
  const offline = useOfflineStore((s) => s.offline);
  const { mobileOpen, setMobileOpen, setPaletteOpen, collapsed } = useSidebarStore();

  return (
    <header
      className={cn(
        "vs-safe-top vs-safe-x-bar sticky top-0 z-20 box-content flex h-16 items-center gap-2 border-b border-[rgba(196,178,141,0.10)] sm:gap-3",
        "bg-[rgba(11,21,40,0.55)] backdrop-blur-xl",
      )}
    >
      <button
        type="button"
        className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sand-200 hover:bg-white/[0.05] lg:hidden"
        aria-label="Menüyü aç"
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={18} strokeWidth={1.5} />
      </button>

      <Link href="/" className="flex h-10 min-w-0 items-center gap-2 text-sand-200 sm:hidden" aria-label="VESPERA ana sayfa">
        <Monogram size={24} />
        <span className="truncate text-[14px] font-medium text-sand-50">{current?.label ?? "VESPERA"}</span>
      </Link>

      <div className="hidden min-w-0 items-center gap-2 sm:flex">
        <span className="font-serif text-[15px] tracking-[0.12em] text-sand-200/80">VESPERA</span>
        {current && (
          <>
            <span className="text-sand-500/60">/</span>
            <span className="truncate text-[13px] text-sand-100/75">{current.label}</span>
          </>
        )}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        {IS_DEMO && (
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="hidden items-center gap-1.5 rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-[11px] text-sand-200/70 sm:inline-flex" />
              }
            >
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sand-300/70" />
              Demo verisi
            </TooltipTrigger>
            <TooltipContent>Demo sürümü: örnek fabrika verisi gösteriliyor. Kendi verilerinizle özelleştirilebilir.</TooltipContent>
          </Tooltip>
        )}
        {offline && !IS_DEMO && (
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="hidden items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11px] text-ink-muted sm:inline-flex" />
              }
            >
              <WifiOff size={12} strokeWidth={1.5} />
              çevrimdışı veri
            </TooltipTrigger>
            <TooltipContent>Backend erişilemedi, örnek veri gösteriliyor.</TooltipContent>
          </Tooltip>
        )}

        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className={cn(
            "group flex h-10 w-10 items-center justify-center gap-2 rounded-xl border border-line bg-white/[0.04] text-[13px] text-sand-100/70 sm:h-9 sm:w-64 sm:justify-start sm:px-3",
            "transition-colors hover:border-line-strong hover:bg-white/[0.07]",
          )}
          aria-label="Ara veya sayfaya git"
        >
          <Search size={15} strokeWidth={1.5} className="text-sand-200/80" />
          <span className="hidden flex-1 text-left sm:inline">Ara veya sayfaya git…</span>
          <kbd className="hidden rounded-md border border-line bg-navy-900/60 px-1.5 py-0.5 font-sans text-[10.5px] text-sand-200/70 sm:inline">
            ⌘K
          </kbd>
        </button>

        <NotificationCenter />

        <Tooltip>
          <TooltipTrigger
            render={
              <Link
                href="/tema"
                className="hidden rounded-xl p-2 text-sand-200 transition-colors hover:bg-white/[0.05] sm:inline-flex"
                aria-label="Ayarlar"
              />
            }
          >
            <Settings size={18} strokeWidth={1.5} />
          </TooltipTrigger>
          <TooltipContent>Ayarlar</TooltipContent>
        </Tooltip>

        <Link
          href="/kisisel"
          aria-label="Profil"
          className="ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand-300 font-serif text-[13px] font-semibold text-navy-950 shadow-[0_8px_18px_-10px_rgba(196,178,141,0.7)] transition-transform hover:-translate-y-px"
        >
          EA
        </Link>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="vs-safe-top w-[300px] max-w-[86vw] border-line bg-navy-800/95 p-0 backdrop-blur-xl">
          <SheetTitle className="sr-only">Menü</SheetTitle>
          <div className="flex h-16 items-center border-b border-line px-5">
            <Wordmark />
          </div>
          <div className="flex h-[calc(100%-4rem)] flex-col">
            <div className="vs-nav-mask relative flex min-h-0 flex-1 flex-col">
              <SidebarNav collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="vs-safe-bottom border-t border-line px-5 py-3 text-[11px] text-ink-muted">© 2026 App On Inc.</div>
          </div>
        </SheetContent>
      </Sheet>
      <span className="sr-only">{collapsed ? "Menü daraltıldı" : ""}</span>
    </header>
  );
}
