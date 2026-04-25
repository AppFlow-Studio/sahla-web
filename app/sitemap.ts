import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://sahla.app";

  const staticPages = [
    { url: base, changeFrequency: "weekly" as const, priority: 1.0 },
    { url: `${base}/pricing`, changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${base}/why-sahla`, changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${base}/about`, changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${base}/demo`, changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${base}/faq`, changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${base}/contact`, changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${base}/customers/mas-si`, changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${base}/privacy`, changeFrequency: "yearly" as const, priority: 0.3 },
    { url: `${base}/terms`, changeFrequency: "yearly" as const, priority: 0.3 },
  ];

  return staticPages.map((page) => ({
    ...page,
    lastModified: new Date(),
  }));
}
