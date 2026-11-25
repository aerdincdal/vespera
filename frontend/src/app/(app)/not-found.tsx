import Link from "next/link";
import { EmptyState } from "@/components/vespera/empty-state";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl pt-16">
      <EmptyState
        icon={Compass}
        title="Sayfa bulunamadı"
        description="Aradığınız ekran taşınmış veya hiç var olmamış olabilir."
        action={<Link href="/dashboard" className="btn-primary inline-flex h-9 items-center px-4 text-[13px]">Genel Dashboard&apos;a dön</Link>}
      />
    </div>
  );
}
