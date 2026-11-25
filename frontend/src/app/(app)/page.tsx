import type { Metadata } from "next";
import { ChatView } from "@/components/chat/chat-view";

export const metadata: Metadata = { title: "Ana Panel" };

export default function HomePage() {
  return <ChatView />;
}
