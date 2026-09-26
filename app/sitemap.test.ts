import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { collectContentRoutes } from "./sitemap";

let contentRoot: string;

beforeAll(() => {
  contentRoot = fs.mkdtempSync(path.join(os.tmpdir(), "sitemap-test-"));
  fs.mkdirSync(path.join(contentRoot, "vs"));
  fs.writeFileSync(
    path.join(contentRoot, "vs", "masjidal.mdx"),
    `---
title: "Sahla vs Masjidal"
description: "desc"
publishedAt: "2026-09-15"
updatedAt: "2026-09-16"
schema: "Article"
relatedPages: []
---

Body.
`
  );
});

afterAll(() => {
  fs.rmSync(contentRoot, { recursive: true, force: true });
});

describe("collectContentRoutes", () => {
  it("builds one sitemap entry per content file, using updatedAt as lastModified", () => {
    const entries = collectContentRoutes(contentRoot);
    expect(entries).toHaveLength(1);
    expect(entries[0].url).toBe("https://sahla.co/vs/masjidal");
    expect(entries[0].lastModified).toEqual(new Date("2026-09-16"));
  });
});
