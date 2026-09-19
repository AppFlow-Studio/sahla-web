import { describe, it, expect } from "vitest";
import { frontmatterSchema } from "./schema";

describe("frontmatterSchema", () => {
  it("accepts a valid Article frontmatter object", () => {
    const result = frontmatterSchema.parse({
      title: "Prayer Times",
      description: "How Sahla handles prayer times.",
      publishedAt: "2026-09-15",
      updatedAt: "2026-09-15",
      schema: "Article",
      relatedPages: ["/pricing"],
    });
    expect(result.title).toBe("Prayer Times");
    expect(result.schema).toBe("Article");
  });

  it("defaults relatedPages to an empty array when omitted", () => {
    const result = frontmatterSchema.parse({
      title: "Glossary term",
      description: "desc",
      publishedAt: "2026-09-15",
      updatedAt: "2026-09-15",
      schema: "Article",
    });
    expect(result.relatedPages).toEqual([]);
  });

  it("rejects schema: FAQPage without faqs", () => {
    expect(() =>
      frontmatterSchema.parse({
        title: "FAQ page",
        description: "desc",
        publishedAt: "2026-09-15",
        updatedAt: "2026-09-15",
        schema: "FAQPage",
        relatedPages: [],
      })
    ).toThrow();
  });

  it("rejects schema: FAQPage with an empty faqs array", () => {
    expect(() =>
      frontmatterSchema.parse({
        title: "FAQ page",
        description: "desc",
        publishedAt: "2026-09-15",
        updatedAt: "2026-09-15",
        schema: "FAQPage",
        relatedPages: [],
        faqs: [],
      })
    ).toThrow();
  });

  it("accepts schema: FAQPage with a non-empty faqs array", () => {
    const result = frontmatterSchema.parse({
      title: "FAQ page",
      description: "desc",
      publishedAt: "2026-09-15",
      updatedAt: "2026-09-15",
      schema: "FAQPage",
      relatedPages: [],
      faqs: [{ q: "Q?", a: "A." }],
    });
    expect(result.faqs).toHaveLength(1);
  });

  it("rejects an unknown schema value", () => {
    expect(() =>
      frontmatterSchema.parse({
        title: "Bad page",
        description: "desc",
        publishedAt: "2026-09-15",
        updatedAt: "2026-09-15",
        schema: "Product",
        relatedPages: [],
      })
    ).toThrow();
  });
});
