import type { Metadata } from "next";
import { DataSourcesView } from "@/components/settings/datasources-view";

export const metadata: Metadata = { title: "Veri Kaynakları" };

export default function Page() {
  return <DataSourcesView />;
}
