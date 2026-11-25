import type { Metadata } from "next";
import { ScenarioView } from "@/components/modules/scenario-view";

export const metadata: Metadata = { title: "Senaryo Analizi" };

export default function SenaryoPage() {
  return <ScenarioView />;
}
