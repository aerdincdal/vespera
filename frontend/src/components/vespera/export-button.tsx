"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import { GlassButton } from "./buttons";

export function ExportButton({ onExport, label = "Dışa aktar", className, disabled }: { onExport: () => void; label?: string; className?: string; disabled?: boolean }) {
  return (
    <GlassButton
      className={className}
      disabled={disabled}
      onClick={() => {
        try {
          onExport();
          toast("CSV indiriliyor", { description: "UTF-8, noktalı virgül ayraçlı; Excel'de doğrudan açılır." });
        } catch (e) {
          toast.error("Dışa aktarma başarısız", { description: e instanceof Error ? e.message : String(e) });
        }
      }}
    >
      <Download size={14} strokeWidth={1.75} /> {label}
    </GlassButton>
  );
}
