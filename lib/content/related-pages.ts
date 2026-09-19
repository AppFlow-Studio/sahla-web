import type { ContentMeta } from "./schema";

function humanizeSegment(segment: string): string {
  return segment
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function resolveRelatedPageLabel(pagePath: string, allContent: ContentMeta[]): string {
  const match = allContent.find((entry) => entry.path === pagePath);
  if (match) return match.title;

  const segments = pagePath.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1] ?? pagePath;
  return humanizeSegment(lastSegment);
}
