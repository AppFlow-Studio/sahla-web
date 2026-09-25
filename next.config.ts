import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

// isbr.sahla.co (the Islamic Society of Bay Ridge site) is also served by
// this app. isbr-site/ is a separate static-export Next.js project; the
// prebuild step copies its output to public/isbr/, and these rewrites map the
// ISBR host's clean URLs onto those files. isbr.localhost is for local dev.
// Keep in sync with ISBR_HOST_RE in proxy.ts.
const ISBR_HOST = "isbr\\.sahla\\.co|isbr\\.localhost";
const onIsbrHost = [{ type: "host" as const, value: ISBR_HOST }];

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        // The raw copy at sahla.co/isbr/... duplicates isbr.sahla.co.
        source: "/isbr/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
  async rewrites() {
    // beforeFiles rewrites chain into each other, so every source excludes
    // paths already under isbr/ to avoid rewriting twice.
    return {
      beforeFiles: [
        { source: "/", has: onIsbrHost, destination: "/isbr/index.html" },
        // Pages: /privacy -> /isbr/privacy.html
        {
          source: "/:page((?!isbr/)[^.]+)",
          has: onIsbrHost,
          destination: "/isbr/:page.html",
        },
        // Files: /hero.jpg, /robots.txt, /privacy/__next._tree.txt, ...
        {
          source: "/:file((?!isbr/).*\\..*)",
          has: onIsbrHost,
          destination: "/isbr/:file",
        },
      ],
    };
  },
};

// withBotId injects the Vercel BotID client script and proxies the protected
// routes so the invisible attestation reaches checkBotId() on the server.
export default withBotId(nextConfig);
