import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: false,
  // Served from the sahla-web app at isbr.sahla.co: the export is copied to
  // sahla-web/public/isbr/, so our /_next assets must live under /isbr to
  // avoid colliding with sahla-web's own /_next.
  assetPrefix: "/isbr",
  // Pinned because this project lives inside the sahla-web repo, which has
  // its own lockfile — without this, Next.js infers sahla-web as the
  // workspace root and pulls in its app/proxy.ts by mistake.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
