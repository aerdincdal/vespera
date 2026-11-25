import type { Metadata } from "next";
import { ReportView } from "@/components/settings/report-view";

export const metadata: Metadata = { title: "Rapor Oluşturma" };

export default function Page() {
  return <ReportView />;
}
