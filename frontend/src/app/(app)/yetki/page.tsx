import type { Metadata } from "next";
import { AccessView } from "@/components/settings/access-view";

export const metadata: Metadata = { title: "Yetki Yönetimi" };

export default function Page() {
  return <AccessView />;
}
