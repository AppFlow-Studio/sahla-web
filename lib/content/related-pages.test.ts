import { describe, it, expect } from "vitest";
import { resolveRelatedPageLabel } from "./related-pages";
import type { ContentMeta } from "./schema";

const sampleContent: ContentMeta[] = [
  {
    title: "Sahla vs Masjidal",
    description: "desc",
    publishedAt: "2026-09-15",
    updatedAt: "2026-09-15",
    schema: "Article",
    relatedPages: [],
    collection: "vs",
    slug: "masjidal",
    path: "/vs/masjidal",
  },
];

describe("resolveRelatedPageLabel", () => {
  it("uses the real title when the path matches known content", () => {
    expect(resolveRelatedPageLabel("/vs/masjidal", sampleContent)).toBe("Sahla vs Masjidal");
  });

  it("humanizes the last path segment when there is no content match", () => {
    expect(resolveRelatedPageLabel("/why-sahla", sampleContent)).toBe("Why Sahla");
  });

  it("humanizes a single-word path", () => {
    expect(resolveRelatedPageLabel("/pricing", sampleContent)).toBe("Pricing");
  });
});
