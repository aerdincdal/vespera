import type { Metadata } from "next";
import { MapView } from "@/components/map/map-view";

export const metadata: Metadata = { title: "Harita Entegrasyonu" };

export default function MapPage() {
  return <MapView />;
}
