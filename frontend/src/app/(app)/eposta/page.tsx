import type { Metadata } from "next";
import { EmailView } from "@/components/settings/email-view";

export const metadata: Metadata = { title: "E-posta Gönderimi" };

export default function Page() {
  return <EmailView />;
}
