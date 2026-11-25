"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, FileSpreadsheet, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { api, IS_DEMO } from "@/lib/api";
import { CHAT_GREETING, CHAT_SUGGESTIONS, mockChat } from "@/lib/mock/chat";
import { parseCsv, type Row } from "@/lib/assistant";
import type { ChatMessage, UploadResult } from "@/lib/types";
import { fmtTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { usePhone } from "@/lib/use-media-query";
import { Monogram } from "@/components/shell/logo";
import { GlassCard } from "@/components/vespera/glass-card";
import { MatrixTable } from "@/components/vespera/data-table";
import { BarChart } from "@/components/charts/bar-chart";
import { LinesChart } from "@/components/charts/lines-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { useOfflineStore } from "@/store/ui";

const uid = () => Math.random().toString(36).slice(2, 10);

export function ChatView() {
  const phone = usePhone();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "greet", role: "assistant", content: CHAT_GREETING, at: "" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState<UploadResult | null>(null);
  /** demo mode: CSV parsed in the browser and used by the offline assistant (null → bundled HR dataset) */
  const [dataset, setDataset] = useState<Row[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setMessages((m) => m.map((x) => (x.id === "greet" && !x.at ? { ...x, at: fmtTime() } : x))), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const user: ChatMessage = { id: uid(), role: "user", content: trimmed, at: fmtTime() };
    setMessages((m) => [...m, user]);
    setInput("");
    setBusy(true);
    const history = messages.filter((m) => m.id !== "greet").map((m) => ({ role: m.role, content: m.content }));
    try {
      const res = await api.chat({ message: trimmed, history, datasourceId: source?.id });
      setMessages((m) => [...m, { id: uid(), role: "assistant", content: res.reply, table: res.table, chart: res.chart, at: fmtTime() }]);
    } catch {
      useOfflineStore.getState().setOffline();
      await new Promise((r) => setTimeout(r, 500));
      const res = await mockChat(trimmed, history, dataset ?? undefined);
      setMessages((m) => [...m, { id: uid(), role: "assistant", content: res.reply, table: res.table, chart: res.chart, at: fmtTime() }]);
    } finally {
      setBusy(false);
      textRef.current?.focus();
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (IS_DEMO) {
      // no backend: parse the CSV in the browser and hand it to the offline assistant
      setUploading(true);
      try {
        if (!/\.csv$/i.test(f.name)) throw new Error("csv-only");
        const parsed = parseCsv(await f.text());
        if (!parsed.rows.length) throw new Error("empty");
        setDataset(parsed.rows);
        setSource({ id: "local", name: f.name, rows: parsed.rows.length, columns: parsed.columns, preview: [] });
        toast.success("Veri kaynağı yüklendi", { description: `${f.name}: ${parsed.rows.length.toLocaleString("tr-TR")} satır, ${parsed.columns.length} sütun` });
        setMessages((m) => [
          ...m,
          { id: uid(), role: "assistant", at: fmtTime(), content: `"${f.name}" tarayıcıda okundu. ${parsed.rows.length.toLocaleString("tr-TR")} satır ve ${parsed.columns.length} sütun buldum; artık bu veri üzerinde soru sorabilirsiniz.` },
        ]);
      } catch (err) {
        const csvOnly = err instanceof Error && err.message === "csv-only";
        toast.error(csvOnly ? "Demo modunda yalnızca CSV" : "Dosya okunamadı", {
          description: csvOnly ? "Excel dosyaları canlı kurulumda desteklenir; lütfen CSV olarak kaydedip yükleyin." : "Dosya boş ya da ayrıştırılamadı.",
        });
      } finally {
        setUploading(false);
        e.target.value = "";
      }
      return;
    }
    setUploading(true);
    try {
      const res = await api.upload(f);
      setSource(res);
      toast.success("Veri kaynağı yüklendi", { description: `${res.name}: ${res.rows.toLocaleString("tr-TR")} satır, ${res.columns.length} sütun` });
      setMessages((m) => [
        ...m,
        { id: uid(), role: "assistant", at: fmtTime(), content: `"${res.name}" yüklendi. ${res.rows.toLocaleString("tr-TR")} satır ve ${res.columns.length} sütun buldum. Artık bu veri üzerinde soru sorabilirsiniz.` },
      ]);
    } catch {
      toast.error("Yükleme başarısız", { description: "Backend erişilemedi. Dosya yüklemek için API'nin çalışması gerekir." });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[340px] flex-col supports-[height:100dvh]:h-[calc(100dvh-7.5rem)] lg:min-h-[560px] lg:supports-[height:100dvh]:h-[calc(100dvh-8rem)]">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <h1 className="font-serif text-[26px] font-medium leading-tight text-sand-50 sm:text-[32px]">Veri Analizi Asistanı</h1>
          <p className="mt-1 hidden text-[13.5px] text-ink-muted sm:block">Verinize doğal dille soru sorun; tablo ve grafiklerle yanıt alın.</p>
        </div>
        {source && (
          <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-white/[0.04] px-3 py-1.5 text-[12px] text-sand-100">
            <FileSpreadsheet size={13} strokeWidth={1.5} className="text-sand-300" />
            <span className="truncate">{source.name}</span>
            <button type="button" aria-label="Veri kaynağını kaldır" onClick={() => { setSource(null); setDataset(null); }} className="vs-tap shrink-0 text-sand-200/70 hover:text-sand-50">
              <X size={12} />
            </button>
          </span>
        )}
      </div>

      <GlassCard hover={false} padded={false} className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div ref={listRef} className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-3 py-5 sm:space-y-6 sm:px-8 sm:py-6" role="log" aria-live="polite">
          {messages.map((m, i) => (
            <Bubble key={m.id} msg={m} showSuggestions={i === 0} onSuggest={send} />
          ))}
          {busy && (
            <div className="flex items-end gap-3">
              <Avatar />
              <div className="glass-strong flex items-center gap-1 rounded-2xl rounded-bl-md px-4 py-3">
                {[0, 1, 2].map((d) => <span key={d} className="vs-dot inline-block h-1.5 w-1.5 rounded-full bg-sand-200" />)}
              </div>
            </div>
          )}
        </div>

        <form
          className="vs-safe-bottom border-t border-line bg-navy-900/40 p-2.5 sm:p-4"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <div className="flex items-end gap-2 rounded-2xl border border-line bg-white/[0.04] p-2 pl-3 transition-colors focus-within:border-line-strong">
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={onFile} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              aria-label="CSV veya Excel yükle"
              className="mb-0.5 rounded-lg p-2 text-sand-200/80 transition-colors hover:bg-white/[0.06] hover:text-sand-50 disabled:opacity-50"
            >
              <Paperclip size={17} strokeWidth={1.5} className={cn(uploading && "animate-pulse")} />
            </button>
            <textarea
              ref={textRef}
              value={input}
              rows={1}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              placeholder={phone ? "Verinize bir soru sorun…" : "Veri Analizi Asistanına bir soru sorun veya grafik/analiz isteyin..."}
              aria-label="Mesaj"
              className="max-h-40 min-h-[40px] min-w-0 flex-1 resize-none bg-transparent py-2 text-[14px] text-sand-50 placeholder:text-ink-muted focus:outline-none focus-visible:!shadow-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || busy}
              aria-label="Gönder"
              className="btn-primary flex h-10 w-10 items-center justify-center rounded-xl disabled:opacity-40 disabled:hover:translate-y-0"
            >
              <ArrowUp size={17} strokeWidth={2} />
            </button>
          </div>
          <p className="mt-2 hidden px-1 text-[11px] text-ink-muted sm:block">Enter gönderir, Shift+Enter yeni satır ekler. Yüklediğiniz dosya yalnızca bu oturumda kullanılır.</p>
        </form>
      </GlassCard>
    </div>
  );
}

function Avatar() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-navy-800 text-sand-300">
      <Monogram size={20} />
    </span>
  );
}

function Bubble({ msg, showSuggestions, onSuggest }: { msg: ChatMessage; showSuggestions?: boolean; onSuggest: (s: string) => void }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex items-end gap-3 vs-fade-slide", isUser && "flex-row-reverse")}>
      {isUser ? (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sand-300 font-serif text-[12px] font-semibold text-navy-950">EA</span>
      ) : (
        <Avatar />
      )}
      <div className={cn("min-w-0 max-w-[calc(100%-2.75rem)] sm:max-w-[72%]", isUser && "text-right", !isUser && (msg.table || msg.chart) && "flex-1 sm:flex-none")}>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-3 text-left text-[14px] leading-relaxed sm:px-4",
            isUser ? "rounded-br-md bg-sand-300 text-navy-950" : "glass-strong rounded-bl-md text-sand-50",
          )}
        >
          <p className="whitespace-pre-wrap">{msg.content}</p>
          {showSuggestions && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {CHAT_SUGGESTIONS.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => onSuggest(s)}
                    className="rounded-full border border-line bg-white/[0.04] px-3 py-1.5 text-[12.5px] text-sand-100 transition-colors hover:border-line-strong hover:bg-white/[0.08] hover:text-sand-50"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {msg.table && (
            <div className="mt-3 rounded-xl border border-line bg-navy-900/40 p-2">
              <MatrixTable columns={msg.table.columns} rows={msg.table.rows} maxHeight={260} dense />
            </div>
          )}
          {msg.chart && (
            <div className="mt-3 rounded-xl border border-line bg-navy-900/40 p-2 sm:p-3">
              {msg.chart.type === "bar" && <BarChart data={msg.chart.data} xKey={msg.chart.xKey} yKeys={msg.chart.yKeys} height={220} colorByCategory={msg.chart.yKeys.length === 1} />}
              {msg.chart.type === "line" && <LinesChart data={msg.chart.data} xKey={msg.chart.xKey} yKeys={msg.chart.yKeys} height={220} />}
              {msg.chart.type === "pie" && (
                <DonutChart
                  data={msg.chart.data.map((d) => ({ name: String(d[msg.chart!.xKey]), value: Number(d[msg.chart!.yKeys[0]]) }))}
                  height={200}
                  legend="bottom"
                />
              )}
            </div>
          )}
        </div>
        {msg.at && <div className="tnum mt-1 px-1 text-[10.5px] text-ink-muted">{msg.at}</div>}
      </div>
    </div>
  );
}
