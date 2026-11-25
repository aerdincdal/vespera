"use client";

import { ArrowUpRight } from "lucide-react";
import type { Tool } from "@/lib/types";
import { LucideIconByName } from "./lucide-by-name";

export function ToolLink({ tool, onClick }: { tool: Tool; onClick?: (tool: Tool) => void }) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(tool)}
      className="group flex w-full items-start gap-3.5 rounded-2xl border border-transparent px-3 py-3 text-left transition-colors hover:border-line hover:bg-white/[0.04]"
    >
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-white/[0.03] text-sand-300">
        <LucideIconByName name={tool.icon ?? "sparkles"} size={17} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[14px] font-semibold text-sand-50">
          {tool.title}
          <ArrowUpRight size={13} strokeWidth={1.75} className="text-sand-300 opacity-0 transition-opacity group-hover:opacity-100" />
        </span>
        <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-muted">{tool.description}</span>
      </span>
    </button>
  );
}
