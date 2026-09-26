import type { MetadataRoute } from "next";
import fs from "node:fs";
import path from "node:path";
import { getAllContentAcrossCollections } from "@/lib/content";

const BASE_URL = "https://sahla.co";

// Top-level app/ directories that are real routes but not public marketing
// pages (auth flow, onboarding, billing, admin/CRM entry points, API). Route
// groups like (admin), (crm), (masjid) are skipped automatically below since
// none of the marketing pages live inside them.
const EXCLUDED_TOP_LEVEL = new Set([
  "api",
  "login",
  "select-org",
  "onboarding",
  "launching",
  "complete",
  "no-crm-access",
  "billing",
]);

const PAGE_FILE = /^page\.(tsx|ts|jsx|js)$/;

function isRouteGroup(segment: string): boolean {
  return segment.startsWith("(") && segment.endsWith(")");
}

function isDynamicSegment(segment: string): boolean {
  return segment.startsWith("[");
}

function isPrivateFolder(segment: string): boolean {
  return segment.startsWith("_");
}

function collectRoutes(dir: string, urlSegments: string[]): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const routes: string[] = [];

  if (entries.some((entry) => entry.isFile() && PAGE_FILE.test(entry.name))) {
    routes.push(urlSegments.length ? `/${urlSegments.join("/")}` : "/");
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const segment = entry.name;

    if (isRouteGroup(segment) || isDynamicSegment(segment) || isPrivateFolder(segment)) {
      continue;
    }
    if (urlSegments.length === 0 && EXCLUDED_TOP_LEVEL.has(segment)) {
      continue;
    }

    routes.push(...collectRoutes(path.join(dir, segment), [...urlSegments, segment]));
  }

  return routes;
}

export function collectContentRoutes(contentRoot?: string): MetadataRoute.Sitemap {
  return getAllContentAcrossCollections(contentRoot).map((entry) => ({
    url: `${BASE_URL}${entry.path}`,
    lastModified: new Date(entry.updatedAt),
  }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const appDir = path.join(process.cwd(), "app");
  const routes = collectRoutes(appDir, []);

  return [
    ...routes.map((route) => ({
      url: `${BASE_URL}${route}`,
      lastModified: new Date(),
    })),
    ...collectContentRoutes(),
  ];
}
