import type { Metadata } from "next";
import { ThemeView } from "@/components/settings/theme-view";

export const metadata: Metadata = { title: "Tema Özelleştirme" };

export default function Page() {
  return <ThemeView />;
}
