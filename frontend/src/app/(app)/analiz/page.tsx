import type { Metadata } from "next";
import { AnalyticsView } from "@/components/modules/analytics-view";

export const metadata: Metadata = { title: "Detaylı Analiz" };

export default function AnalizPage() {
  return <AnalyticsView />;
}
