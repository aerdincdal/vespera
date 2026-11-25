"use client";

import * as Icons from "lucide-react";
import type { LucideProps } from "lucide-react";

type IconComponent = React.ComponentType<LucideProps>;

function toPascal(name: string): string {
  return name.split(/[-_\s]+/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
}

/** Resolve a kebab-case icon name from the API ("trending-up") to a lucide icon. */
export function LucideIconByName({ name, size = 18, strokeWidth = 1.5, ...rest }: { name: string } & LucideProps) {
  const lib = Icons as unknown as Record<string, IconComponent>;
  const Comp = lib[toPascal(name)] ?? lib[`${toPascal(name)}Icon`] ?? Icons.Circle;
  return <Comp size={size} strokeWidth={strokeWidth} {...rest} />;
}
