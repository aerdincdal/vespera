"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { NAV_GROUPS } from "@/lib/nav";
import { useSidebarStore } from "@/store/ui";

export function CommandPalette() {
  const open = useSidebarStore((s) => s.paletteOpen);
  const setOpen = useSidebarStore((s) => s.setPaletteOpen);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Komut Paleti"
      description="Sayfalar arasında gezin"
      className="max-sm:top-[max(1rem,env(safe-area-inset-top))] sm:max-w-lg"
    >
      {/* cmdk parts need the <Command> root for their store; without it the palette throws on open */}
      <Command loop filter={rankNav}>
      <CommandInput placeholder="Sayfa ara…" className="focus-visible:!shadow-none" />
      <CommandList className="max-h-[min(60vh,420px)] max-sm:max-h-[calc(100dvh-9rem)]">
        <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
        {NAV_GROUPS.map((g) => (
          <CommandGroup key={g.title} heading={g.title}>
            {g.items.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.href}
                  value={item.href}
                  keywords={[item.label, ...(item.keywords ? String(item.keywords).split(/[\s,]+/) : [])]}
                  onSelect={() => {
                    setOpen(false);
                    router.push(item.href);
                  }}
                >
                  <Icon size={16} strokeWidth={1.5} className="text-sand-200" />
                  <span>{item.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
      </Command>
    </CommandDialog>
  );
}

const fold = (v: string) => v.toLocaleLowerCase("tr").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i");

/** Label matches first (prefix > word prefix > substring), keyword-only matches after. */
function rankNav(_value: string, search: string, keywords?: string[]): number {
  const q = fold(search.trim());
  if (!q) return 1;
  const [label = "", ...rest] = keywords ?? [];
  const l = fold(label);
  if (l.startsWith(q)) return 1;
  if (l.split(/[\s&(),-]+/).some((w) => w.startsWith(q))) return 0.9;
  if (l.includes(q)) return 0.75;
  const k = rest.map(fold);
  if (k.some((w) => w.startsWith(q))) return 0.4;
  if (k.some((w) => w.includes(q))) return 0.25;
  return 0;
}
