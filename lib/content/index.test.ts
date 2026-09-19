import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  getAllContentMeta,
  getContentBySlugOrNull,
  getAllContentAcrossCollections,
} from "./index";

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
  // Sits outside every collection folder — a traversal slug must not reach it.
  fs.writeFileSync(
    path.join(contentRoot, "outside.mdx"),
    `---
title: "Outside"
description: "Not inside any collection."
publishedAt: "2026-09-15"
updatedAt: "2026-09-15"
schema: "Article"
---

Outside body.
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

describe("getContentBySlugOrNull", () => {
  it("returns meta and the raw MDX body for a known slug", () => {
    const content = getContentBySlugOrNull("features", "prayer-times", contentRoot);
    expect(content).not.toBeNull();
    expect(content!.meta.slug).toBe("prayer-times");
    expect(content!.body.trim()).toBe("Body content here.");
  });

  it("returns null for an unknown slug instead of throwing", () => {
    expect(getContentBySlugOrNull("features", "does-not-exist", contentRoot)).toBeNull();
  });

  it("returns null for a collection folder that doesn't exist", () => {
    expect(getContentBySlugOrNull("vs", "anything", contentRoot)).toBeNull();
  });

  it("returns null for a traversal slug without reading outside the collection", () => {
    // `outside.mdx` sits one level above `features/` and is valid content —
    // the only thing stopping it from being served at /features/../outside
    // is the slug charset guard.
    expect(getContentBySlugOrNull("features", "../outside", contentRoot)).toBeNull();
    expect(getContentBySlugOrNull("features", "..\\outside", contentRoot)).toBeNull();
  });

  it("returns null for other unsafe slug characters", () => {
    for (const slug of ["foo/bar", "foo.bar", "foo bar", "", "foo\0bar"]) {
      expect(getContentBySlugOrNull("features", slug, contentRoot)).toBeNull();
    }
  });
});

describe("malformed frontmatter", () => {
  let brokenRoot: string;

  beforeAll(() => {
    brokenRoot = fs.mkdtempSync(path.join(os.tmpdir(), "content-broken-"));
    fs.mkdirSync(path.join(brokenRoot, "features"));
    fs.writeFileSync(
      path.join(brokenRoot, "features", "broken-page.mdx"),
      `---
title: "Broken"
description: "desc"
publishedAt: "2026-09-31"
updatedAt: "2026-09-15"
schema: "Article"
---

Body.
`
    );
  });

  afterAll(() => {
    fs.rmSync(brokenRoot, { recursive: true, force: true });
  });

  it("throws an error naming the offending file", () => {
    expect(() => getContentBySlugOrNull("features", "broken-page", brokenRoot)).toThrow(
      /features\/broken-page\.mdx/
    );
  });

  it("names the offending file when scanning a whole collection", () => {
    expect(() => getAllContentMeta("features", brokenRoot)).toThrow(
      /Invalid frontmatter in features\/broken-page\.mdx/
    );
  });
});

describe("getAllContentAcrossCollections", () => {
  it("flattens every collection into one list", () => {
    const all = getAllContentAcrossCollections(contentRoot);
    expect(all.map((entry) => entry.slug)).toContain("prayer-times");
    expect(all).toHaveLength(1);
  });
});
