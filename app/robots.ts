import type { MetadataRoute } from "next";
import { headers } from "next/headers";

// crm.sahla.co is the mosque admin portal (Clerk-gated, no public content) —
// it's served by this same Next.js app, so this route must tell them apart
// by request host rather than by path. It must never be crawlable: a login
// page ranking for "Sahla" would compete with the real marketing pages.
const CRM_HOST = "crm.sahla.co";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host") ?? "";

  if (host === CRM_HOST || host.startsWith(`${CRM_HOST}:`)) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/login", "/overview", "/launch", "/admin", "/api/"],
      },
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-User",
          "PerplexityBot",
          "Perplexity-User",
          "Google-Extended",
          "Applebot-Extended",
          "CCBot",
          "meta-externalagent",
        ],
        allow: "/",
      },
    ],
    sitemap: "https://sahla.co/sitemap.xml",
    host: "https://sahla.co",
  };
}
