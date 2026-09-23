import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: false,
  // Pinned because this project lives inside the sahla-web repo, which has
  // its own lockfile — without this, Next.js infers sahla-web as the
  // workspace root and pulls in its app/proxy.ts by mistake.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
