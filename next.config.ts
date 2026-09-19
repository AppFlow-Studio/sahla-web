import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // crm.sahla.co (the Clerk-gated mosque admin portal) is served by this
  // same app, so it can only be kept out of search results by host, not by
  // path. Belt-and-suspenders with app/robots.ts's per-host disallow rule.
  async headers() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "crm.sahla.co" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
};

// withBotId injects the Vercel BotID client script and proxies the protected
// routes so the invisible attestation reaches checkBotId() on the server.
export default withBotId(nextConfig);
