import type { Metadata } from "next";
import { PersonalView } from "@/components/settings/personal-view";

export const metadata: Metadata = { title: "Kişisel Dashboard" };

export default function Page() {
  return <PersonalView />;
}
