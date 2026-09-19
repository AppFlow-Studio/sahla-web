import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getAllContentMeta, getContentBySlug, getAllContentAcrossCollections } from "./index";

let contentRoot: string;

beforeAll(() => {
  contentRoot = fs.mkdtempSync(path.join(os.tmpdir(), "content-test-"));
  fs.mkdirSync(path.join(contentRoot, "features"));
  fs.mkdirSync(path.join(contentRoot, "glossary"));
  fs.writeFileSync(
    path.join(contentRoot, "features", "prayer-times.mdx"),
    `---
title: "Prayer Times"
description: "How Sahla handles prayer times."
publishedAt: "2026-09-15"
updatedAt: "2026-09-15"
schema: "Article"
relatedPages: ["/pricing"]
---

Body content here.
`
  );
});

afterAll(() => {
  fs.rmSync(contentRoot, { recursive: true, force: true });
});

describe("getAllContentMeta", () => {
  it("parses frontmatter for every file in a collection", () => {
    const items = getAllContentMeta("features", contentRoot);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Prayer Times");
    expect(items[0].collection).toBe("features");
    expect(items[0].slug).toBe("prayer-times");
    expect(items[0].path).toBe("/features/prayer-times");
  });

  it("returns an empty array for a collection with no files", () => {
    expect(getAllContentMeta("glossary", contentRoot)).toEqual([]);
  });

  it("returns an empty array for a collection whose folder doesn't exist", () => {
    expect(getAllContentMeta("vs", contentRoot)).toEqual([]);
  });
});

describe("getContentBySlug", () => {
  it("returns meta and the raw MDX body for a known slug", () => {
    const { meta, body } = getContentBySlug("features", "prayer-times", contentRoot);
    expect(meta.slug).toBe("prayer-times");
    expect(body.trim()).toBe("Body content here.");
  });
});

describe("getAllContentAcrossCollections", () => {
  it("flattens every collection into one list", () => {
    const all = getAllContentAcrossCollections(contentRoot);
    expect(all.map((entry) => entry.slug)).toContain("prayer-times");
    expect(all).toHaveLength(1);
  });
});
