"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import type { Location } from "@/lib/types";
import { fmtTRY } from "@/lib/format";

import { PERF_COLOR } from "./perf";

const TILE_URL =
  process.env.NEXT_PUBLIC_TILE_URL ??
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
const TILE_LABELS_URL = process.env.NEXT_PUBLIC_TILE_URL
  ? ""
  : "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}";
const TILE_ATTRIBUTION =
  process.env.NEXT_PUBLIC_TILE_ATTRIBUTION ??
  'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, DeLorme, NAVTEQ · &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

function FitBounds({ points }: { points: Location[] }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const lats = points.map((p) => p.lat), lngs = points.map((p) => p.lng);
    map.fitBounds(
      [[Math.min(...lats) - 0.8, Math.min(...lngs) - 1], [Math.max(...lats) + 0.8, Math.max(...lngs) + 1]],
      { animate: true, maxZoom: 7 },
    );
  }, [points, map]);
  return null;
}

export default function LocationMap({ points, layers }: { points: Location[]; layers: { labels: boolean } }) {
  const maxValue = Math.max(...points.map((p) => p.value), 1);
  return (
    <MapContainer center={[39.0, 34.5]} zoom={6} scrollWheelZoom={false} className="h-full w-full" attributionControl>
      {/* Carto dark_matter now requires an API key; Esri Dark Gray Canvas is key-free. Set NEXT_PUBLIC_TILE_URL to override. */}
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={16} />
      {layers.labels && TILE_LABELS_URL && <TileLayer url={TILE_LABELS_URL} maxZoom={16} />}
      <FitBounds points={points} />
      {points.map((p) => {
        const r = 9 + Math.sqrt(p.value / maxValue) * 14;
        const c = PERF_COLOR[p.performance];
        return (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={r}
            pathOptions={{ color: c, weight: 1.5, fillColor: c, fillOpacity: 0.35 }}
          >
            <Popup>
              <div className="font-serif text-[15px] text-sand-50">{p.name}</div>
              <div className="mt-1 text-[12px] text-ink-muted">{p.region} · {p.type}</div>
              <div className="mt-2 flex items-center justify-between gap-4 text-[12.5px]">
                <span className="tnum text-sand-50">{fmtTRY(p.value)}</span>
                <span className="tnum" style={{ color: String(p.trend).startsWith("-") ? "#c96b6b" : "#7fb28a" }}>{p.trend}</span>
              </div>
              <div className="mt-1 text-[12px]" style={{ color: c }}>Performans: {p.performance}</div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
