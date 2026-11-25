import type { Metadata } from "next";
import { StudioView } from "@/components/modules/studio-view";

export const metadata: Metadata = { title: "Görselleştirme Stüdyosu" };

export default function StudioPage() {
  return <StudioView />;
}
