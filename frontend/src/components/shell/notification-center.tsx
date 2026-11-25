"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { formatDistanceToNowStrict, isValid, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { api } from "@/lib/api";
import { notificationsMock } from "@/lib/mock";
import { tryApi, useApi } from "@/lib/use-api";
import type { Notification, NotificationLevel } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const LEVEL_DOT: Record<NotificationLevel, string> = {
  ok: "bg-ok shadow-[0_0_0_3px_rgba(127,178,138,0.18)]",
  warn: "bg-warn shadow-[0_0_0_3px_rgba(217,184,106,0.18)]",
  err: "bg-err shadow-[0_0_0_3px_rgba(201,107,107,0.18)]",
  info: "bg-info shadow-[0_0_0_3px_rgba(127,159,207,0.18)]",
};

export function relativeTimeTr(value: string): string {
  if (!value) return "";
  const d = parseISO(value);
  if (!isValid(d)) return value;
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "az önce";
  return `${formatDistanceToNowStrict(d, { locale: tr, roundingMethod: "floor" })} önce`;
}

export function NotificationCenter() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { data, setData, loading } = useApi(api.notifications, notificationsMock);
  const items = useMemo(() => [...(data ?? [])].sort((a, b) => Number(a.read) - Number(b.read)), [data]);
  const unread = items.filter((n) => !n.read).length;

  async function markRead(n: Notification) {
    if (!n.read) {
      setData((prev) => (prev ?? []).map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      await tryApi(() => api.notificationRead(n.id), () => undefined);
    }
  }
  async function openItem(n: Notification) {
    void markRead(n);
    setOpen(false);
    if (n.href) router.push(n.href);
  }
  async function readAll() {
    setData((prev) => (prev ?? []).map((x) => ({ ...x, read: true })));
    await tryApi(() => api.notificationsReadAll(), () => undefined);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="relative rounded-xl p-2 text-sand-200 transition-colors hover:bg-white/[0.05] data-[popup-open]:bg-white/[0.06]"
            aria-label={unread ? `Bildirimler, ${unread} okunmamış` : "Bildirimler"}
          />
        }
      >
        <Bell size={18} strokeWidth={1.5} />
        {unread > 0 && (
          <span className="tnum absolute -right-0.5 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-copper px-1 text-[10px] font-semibold leading-none text-navy-950 ring-2 ring-navy-900">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={10} className="glass-strong w-[360px] max-w-[calc(100vw-1.5rem)] gap-0 rounded-2xl border-line p-0 text-sand-50 shadow-2xl ring-0">
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div>
            <div className="font-serif text-[15px] font-medium">Bildirimler</div>
            <div className="text-[11.5px] text-ink-muted">{unread ? `${unread} okunmamış` : "Hepsi okundu"}</div>
          </div>
          <button
            type="button"
            onClick={() => void readAll()}
            disabled={!unread}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] text-sand-200 transition-colors hover:bg-white/[0.06] hover:text-sand-50 disabled:cursor-default disabled:opacity-40"
          >
            <CheckCheck size={13} strokeWidth={1.75} /> Tümünü okundu işaretle
          </button>
        </header>
        <ul className="vs-nav-scroll max-h-[420px] overflow-y-auto py-1" aria-busy={loading}>
          {items.length === 0 && (
            <li className="flex flex-col items-center gap-2 px-4 py-10 text-center text-[12.5px] text-ink-muted">
              <Inbox size={18} strokeWidth={1.5} className="text-sand-300" />
              Yeni bildirim yok.
            </li>
          )}
          {items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => void openItem(n)}
                className={cn(
                  "group relative flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-[rgba(196,178,141,0.06)]",
                  !n.read && "bg-white/[0.025]",
                )}
              >
                <span aria-hidden className={cn("mt-[6px] h-2 w-2 shrink-0 rounded-full", LEVEL_DOT[n.level], n.read && "opacity-45 shadow-none")} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className={cn("truncate text-[13px]", n.read ? "text-sand-100/80" : "font-semibold text-sand-50")}>{n.title}</span>
                    <span className="tnum shrink-0 text-[11px] text-ink-muted">{relativeTimeTr(n.time)}</span>
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-[12px] leading-snug text-ink-muted">{n.body}</span>
                </span>
                {!n.read && <span aria-hidden className="absolute left-0 top-3 bottom-3 w-[2px] rounded-r bg-sand-300 opacity-70" />}
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
