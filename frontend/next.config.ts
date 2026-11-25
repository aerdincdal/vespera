import type { NextConfig } from "next";

// Static export: `next build` writes a self-contained `out/` folder that any
// static host can serve. The backend URL is baked in at build time from
// NEXT_PUBLIC_API_URL (see .env.production). `next dev` is unaffected: Next 16
// keeps its dev artifacts in `.next/dev`, so build and dev never collide.
const BASE = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").trim();

const nextConfig: NextConfig = {
  ...(BASE ? { basePath: BASE, assetPrefix: BASE } : {}),
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true, remotePatterns: [] },
};

export default nextConfig;
