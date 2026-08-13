import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

// withBotId injects the Vercel BotID client script and proxies the protected
// routes so the invisible attestation reaches checkBotId() on the server.
export default withBotId(nextConfig);
