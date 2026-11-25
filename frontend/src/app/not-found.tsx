import type { Metadata } from "next";
import Link from "next/link";
import { Compass } from "lucide-react";
import { Wordmark } from "@/components/shell/logo";

export const metadata: Metadata = { title: "Sayfa bulunamadı" };

export default function RootNotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="mb-10">
        <Wordmark />
      </div>
      <section className="glass w-full max-w-lg rounded-[20px] p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-white/[0.03] text-sand-300">
          <Compass size={20} strokeWidth={1.5} />
        </span>
        <p className="eyebrow mt-6">404</p>
        <h1 className="mt-2 font-serif text-[26px] font-medium text-sand-50">Sayfa bulunamadı</h1>
        <p className="mx-auto mt-2 max-w-sm text-[13.5px] text-ink-muted">
          Aradığınız ekran taşınmış, adı değişmiş ya da hiç var olmamış olabilir.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link href="/dashboard" className="btn-primary inline-flex h-9 items-center px-4 text-[13px]">Genel Dashboard&apos;a dön</Link>
          <Link href="/" className="btn-glass inline-flex h-9 items-center px-3.5 text-[13px]">Ana Panel</Link>
        </div>
      </section>
      <p className="mt-10 text-[11px] text-ink-muted">© 2026 App On Inc.</p>
    </main>
  );
}
