"use client";

import { useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { applyThemeToDocument, useThemeStore } from "@/store/theme";
import { Splash } from "./splash";

function ThemeApplier() {
  const colors = useThemeStore((s) => s.colors);
  useEffect(() => {
    applyThemeToDocument(colors);
  }, [colors]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delay={300}>
      <ThemeApplier />
      {children}
      <Splash />
      <Toaster position="bottom-right" theme="dark" />
    </TooltipProvider>
  );
}
