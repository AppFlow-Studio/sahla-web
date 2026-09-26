# MDX Content System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a content author drop a `.mdx` file into `content/{resources,glossary,vs,features}/` and get a live, fully SEO-correct page — title/description, canonical URL, JSON-LD, sitemap entry, breadcrumbs, reading time, related pages — with zero code changes.

**Architecture:** `gray-matter` parses each `.mdx` file into `{ frontmatter, body }` without compiling anything, so a cheap synchronous content index can power `generateStaticParams`, the sitemap, and related-page lookups. `next-mdx-remote/rsc` compiles the raw body string into React on the server inside one shared `ContentPage` component that all four dynamic routes call.

**Tech Stack:** Next.js 16.2.0 (App Router), TypeScript, Zod (already a dependency), Tailwind CSS v4, `gray-matter`, `next-mdx-remote`, `@tailwindcss/typography`, Vitest (new — this repo has no test runner yet).

**Spec:** `docs/superpowers/specs/2026-09-19-mdx-content-system-design.md`

## Global Constraints

- `schema` frontmatter field is limited to `"Article" | "FAQPage"` — no other schema.org types are supported by this system.
- New dependencies: `gray-matter`, `next-mdx-remote` (runtime); `@tailwindcss/typography`, `vitest` (dev). No `reading-time` package — reading time is computed with a ~5-line word-count function.
- Every content page sets `alternates: { canonical: "./" }` in `generateMetadata`, matching the convention already used across the site (see `app/why-sahla/page.tsx` and siblings).
- `content/` collection folder names double as URL prefixes (`content/resources/*.mdx` → `/resources/[slug]`, etc.) — no separate route-label mapping table for paths, only for display labels.
- `getAllContentMeta`, `getContentBySlug`, and `getAllContentAcrossCollections` in `lib/content/index.ts` all accept an optional `contentRoot` override (default: `path.join(process.cwd(), "content")`) so tests can point at a temp fixture directory instead of the real `content/` folder.
- The test page's content must be sourced from copy already live elsewhere on the site — no invented product claims.
- Breadcrumb items may omit `url` (no index pages exist yet for the four collections) — both `BreadcrumbJsonLd` and the new visual `Breadcrumbs` component render such an item as plain, non-linked text instead of pointing at a page that doesn't exist.

---

### Task 1: Test tooling and dependencies

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `lib/content/sanity.test.ts` (temporary sanity check, deleted at the end of this task)

**Interfaces:**
- Produces: a working `npm test` command (`vitest run`) that later tasks' tests run under.

- [ ] **Step 1: Install runtime and dev dependencies**

Run:
```bash
npm install gray-matter next-mdx-remote
npm install -D vitest @tailwindcss/typography
```

If npm reports a peer-dependency conflict between `next-mdx-remote` and `next@16.2.0`, check `next-mdx-remote`'s GitHub releases for Next 16 App Router (RSC) compatibility before using `--legacy-peer-deps` — do not force-install past an unresolved incompatibility.

- [ ] **Step 2: Add the `test` script**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run"
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
```

- [ ] **Step 4: Write a sanity test to confirm the runner and alias work**

Create `lib/content/sanity.test.ts`:
```ts
import { describe, it, expect } from "vitest";

describe("vitest setup", () => {
  it("runs a basic assertion", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run the test suite**

Run: `npm test`
Expected: 1 file, 1 test, PASS.

- [ ] **Step 6: Delete the sanity test**

The sanity check has served its purpose — real tests start in Task 2.
```bash
rm lib/content/sanity.test.ts
```

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest and MDX content system dependencies"
```

---

### Task 2: Frontmatter schema and types

**Files:**
- Create: `lib/content/schema.ts`
- Test: `lib/content/schema.test.ts`

**Interfaces:**
- Produces:
  - `COLLECTIONS: readonly ["resources", "glossary", "vs", "features"]`
  - `type Collection = "resources" | "glossary" | "vs" | "features"`
  - `frontmatterSchema: ZodSchema` (parses/validates raw frontmatter)
  - `type ContentFrontmatter = z.infer<typeof frontmatterSchema>`
  - `type ContentMeta = ContentFrontmatter & { collection: Collection; slug: string; path: string }`

- [ ] **Step 1: Write the failing tests**

Create `lib/content/schema.test.ts`:
```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/content/schema.test.ts`
Expected: FAIL — `./schema` has no exported member `frontmatterSchema` (module doesn't exist yet).

- [ ] **Step 3: Write the implementation**

Create `lib/content/schema.ts`:
```ts
import { z } from "zod";

export const COLLECTIONS = ["resources", "glossary", "vs", "features"] as const;
export type Collection = (typeof COLLECTIONS)[number];

const faqSchema = z.object({
  q: z.string().min(1),
  a: z.string().min(1),
});

export const frontmatterSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().min(1),
    publishedAt: z.string().min(1),
    updatedAt: z.string().min(1),
    schema: z.enum(["Article", "FAQPage"]),
    relatedPages: z.array(z.string()).default([]),
    faqs: z.array(faqSchema).optional(),
  })
  .refine((data) => data.schema !== "FAQPage" || (data.faqs && data.faqs.length > 0), {
    message: 'faqs must be a non-empty array when schema is "FAQPage"',
    path: ["faqs"],
  });

export type ContentFrontmatter = z.infer<typeof frontmatterSchema>;

export type ContentMeta = ContentFrontmatter & {
  collection: Collection;
  slug: string;
  path: string;
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/content/schema.test.ts`
Expected: 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/content/schema.ts lib/content/schema.test.ts
git commit -m "feat(content): add frontmatter schema and content types"
```

---

### Task 3: Reading time utility

**Files:**
- Create: `lib/content/reading-time.ts`
- Test: `lib/content/reading-time.test.ts`

**Interfaces:**
- Produces: `estimateReadingTime(body: string, wordsPerMinute?: number): number` (whole minutes, minimum 1)

- [ ] **Step 1: Write the failing tests**

Create `lib/content/reading-time.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { estimateReadingTime } from "./reading-time";

describe("estimateReadingTime", () => {
  it("returns 1 minute for very short text", () => {
    expect(estimateReadingTime("just a few words here")).toBe(1);
  });

  it("returns 2 minutes for roughly 400 words", () => {
    const body = Array(400).fill("word").join(" ");
    expect(estimateReadingTime(body)).toBe(2);
  });

  it("collapses multiple whitespace characters into single word boundaries", () => {
    const body = "one\n\ntwo   three\tfour";
    expect(estimateReadingTime(body, 2)).toBe(2);
  });

  it("never returns less than 1 minute for empty or whitespace-only input", () => {
    expect(estimateReadingTime("   ")).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/content/reading-time.test.ts`
Expected: FAIL — module `./reading-time` does not exist.

- [ ] **Step 3: Write the implementation**

Create `lib/content/reading-time.ts`:
```ts
export function estimateReadingTime(body: string, wordsPerMinute = 200): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/content/reading-time.test.ts`
Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/content/reading-time.ts lib/content/reading-time.test.ts
git commit -m "feat(content): add reading time estimator"
```

---

### Task 4: Related-page label resolver

**Files:**
- Create: `lib/content/related-pages.ts`
- Test: `lib/content/related-pages.test.ts`

**Interfaces:**
- Consumes: `ContentMeta` from `lib/content/schema.ts` (Task 2)
- Produces: `resolveRelatedPageLabel(pagePath: string, allContent: ContentMeta[]): string`

- [ ] **Step 1: Write the failing tests**

Create `lib/content/related-pages.test.ts`:
```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/content/related-pages.test.ts`
Expected: FAIL — module `./related-pages` does not exist.

- [ ] **Step 3: Write the implementation**

Create `lib/content/related-pages.ts`:
```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/content/related-pages.test.ts`
Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/content/related-pages.ts lib/content/related-pages.test.ts
git commit -m "feat(content): resolve related-page link labels"
```

---

### Task 5: Content reader module

**Files:**
- Create: `lib/content/index.ts`
- Test: `lib/content/index.test.ts`

**Interfaces:**
- Consumes: `frontmatterSchema`, `Collection`, `ContentMeta`, `COLLECTIONS` from `lib/content/schema.ts` (Task 2)
- Produces:
  - `getAllContentMeta(collection: Collection, contentRoot?: string): ContentMeta[]`
  - `getContentBySlug(collection: Collection, slug: string, contentRoot?: string): { meta: ContentMeta; body: string }`
  - `getAllContentAcrossCollections(contentRoot?: string): ContentMeta[]`

- [ ] **Step 1: Write the failing tests**

Create `lib/content/index.test.ts`:
```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/content/index.test.ts`
Expected: FAIL — module `./index` does not exist.

- [ ] **Step 3: Write the implementation**

Create `lib/content/index.ts`:
```ts
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { frontmatterSchema, COLLECTIONS, type Collection, type ContentMeta } from "./schema";

const DEFAULT_CONTENT_ROOT = path.join(process.cwd(), "content");

function readCollectionFilenames(collection: Collection, contentRoot: string): string[] {
  const dir = path.join(contentRoot, collection);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((file) => file.endsWith(".mdx"));
}

function parseFile(
  collection: Collection,
  contentRoot: string,
  filename: string
): { meta: ContentMeta; body: string } {
  const slug = filename.replace(/\.mdx$/, "");
  const raw = fs.readFileSync(path.join(contentRoot, collection, filename), "utf8");
  const { data, content } = matter(raw);
  const frontmatter = frontmatterSchema.parse(data);

  const meta: ContentMeta = {
    ...frontmatter,
    collection,
    slug,
    path: `/${collection}/${slug}`,
  };

  return { meta, body: content };
}

export function getAllContentMeta(
  collection: Collection,
  contentRoot: string = DEFAULT_CONTENT_ROOT
): ContentMeta[] {
  return readCollectionFilenames(collection, contentRoot).map(
    (filename) => parseFile(collection, contentRoot, filename).meta
  );
}

export function getContentBySlug(
  collection: Collection,
  slug: string,
  contentRoot: string = DEFAULT_CONTENT_ROOT
): { meta: ContentMeta; body: string } {
  return parseFile(collection, contentRoot, `${slug}.mdx`);
}

export function getAllContentAcrossCollections(
  contentRoot: string = DEFAULT_CONTENT_ROOT
): ContentMeta[] {
  return COLLECTIONS.flatMap((collection) => getAllContentMeta(collection, contentRoot));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/content/index.test.ts`
Expected: 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/content/index.ts lib/content/index.test.ts
git commit -m "feat(content): add fs-backed content reader"
```

---

### Task 6: Sitemap integration

**Files:**
- Modify: `app/sitemap.ts`
- Test: `app/sitemap.test.ts`

**Interfaces:**
- Consumes: `getAllContentAcrossCollections` from `lib/content/index.ts` (Task 5)
- Produces: `collectContentRoutes(contentRoot?: string): MetadataRoute.Sitemap` (named export alongside the existing default `sitemap()`)

- [ ] **Step 1: Write the failing test**

Create `app/sitemap.test.ts`:
```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run app/sitemap.test.ts`
Expected: FAIL — `./sitemap` has no exported member `collectContentRoutes`.

- [ ] **Step 3: Modify `app/sitemap.ts`**

Add the import and the new function, and use it from the default export. The file currently ends with:
```ts
export default function sitemap(): MetadataRoute.Sitemap {
  const appDir = path.join(process.cwd(), "app");
  const routes = collectRoutes(appDir, []);

  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
  }));
}
```

Replace it with:
```ts
import { getAllContentAcrossCollections } from "@/lib/content";

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
```

(Add the `import { getAllContentAcrossCollections } from "@/lib/content";` line near the top, next to the existing `fs`/`path` imports.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run app/sitemap.test.ts`
Expected: 1 test PASS.

- [ ] **Step 5: Commit**

```bash
git add app/sitemap.ts app/sitemap.test.ts
git commit -m "feat(seo): include MDX content pages in sitemap.xml"
```

---

### Task 7: `ArticleJsonLd` and optional breadcrumb URLs

**Files:**
- Modify: `app/components/JsonLd.tsx`

**Interfaces:**
- Produces: `ArticleJsonLd({ headline, description, datePublished, dateModified, url }): JSX.Element`
- Modifies: `BreadcrumbJsonLd`'s `items` type from `Array<{ name: string; url: string }>` to `Array<{ name: string; url?: string }>` (backward compatible — every existing call site already supplies `url`)

No unit test for this task: `JsonLd.tsx` is a thin JSX/schema.org wrapper around the existing `JsonLd` primitive, and this repo has no React rendering test setup (per the testing-approach decision, only pure logic gets unit tests). Verified by `next build` + browser view-source in Task 13.

- [ ] **Step 1: Widen the `JsonLdType` union**

In `app/components/JsonLd.tsx`, find:
```ts
type JsonLdType =
  | "Organization"
  | "WebSite"
  | "SoftwareApplication"
  | "BreadcrumbList"
  | "FAQPage"
  | "Product";
```
Change to:
```ts
type JsonLdType =
  | "Organization"
  | "WebSite"
  | "SoftwareApplication"
  | "BreadcrumbList"
  | "FAQPage"
  | "Product"
  | "Article";
```

- [ ] **Step 2: Make `BreadcrumbJsonLd` items' `url` optional**

Find:
```tsx
export function BreadcrumbJsonLd({
  items,
}: {
  items: Array<{ name: string; url: string }>;
}) {
  return (
    <JsonLd
      type="BreadcrumbList"
      data={{
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}
```
Replace with:
```tsx
export function BreadcrumbJsonLd({
  items,
}: {
  items: Array<{ name: string; url?: string }>;
}) {
  return (
    <JsonLd
      type="BreadcrumbList"
      data={{
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          ...(item.url ? { item: item.url } : {}),
        })),
      }}
    />
  );
}
```

- [ ] **Step 3: Add `ArticleJsonLd`**

Add after `FAQPageJsonLd` (before `ProductJsonLd`, or after it — either is fine, just keep it alongside the other typed wrappers):
```tsx
/** Any MDX content page (resources/glossary/vs/features) whose frontmatter sets schema: "Article". */
export function ArticleJsonLd({
  headline,
  description,
  datePublished,
  dateModified,
  url,
}: {
  headline: string;
  description: string;
  datePublished: string;
  dateModified: string;
  url: string;
}) {
  return (
    <JsonLd
      type="Article"
      data={{
        headline,
        description,
        datePublished,
        dateModified,
        url,
        author: { "@type": "Organization", name: "Sahla" },
        publisher: { "@type": "Organization", name: "Sahla" },
      }}
    />
  );
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors introduced by this file. (The repo has `typescript.ignoreBuildErrors: true` in `next.config.ts`, but this check still catches obvious typos before they reach a manual build.)

- [ ] **Step 5: Commit**

```bash
git add app/components/JsonLd.tsx
git commit -m "feat(seo): add ArticleJsonLd, make breadcrumb item URLs optional"
```

---

### Task 8: Visual breadcrumbs component

**Files:**
- Create: `app/components/Breadcrumbs.tsx`

**Interfaces:**
- Produces: `Breadcrumbs({ items }: { items: Array<{ name: string; url?: string }> }): JSX.Element`

No unit test (JSX component, no React rendering harness in this repo per the testing-approach decision). Verified visually in Task 13.

- [ ] **Step 1: Write the component**

Create `app/components/Breadcrumbs.tsx`:
```tsx
import Link from "next/link";

export function Breadcrumbs({
  items,
}: {
  items: Array<{ name: string; url?: string }>;
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-[13px] text-dark-green/55">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.name}-${i}`} className="flex items-center gap-1.5">
              {item.url && !isLast ? (
                <Link href={item.url} className="hover:text-dark-green hover:underline">
                  {item.name}
                </Link>
              ) : (
                <span className={isLast ? "text-dark-green/80" : undefined}>{item.name}</span>
              )}
              {!isLast && <span aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add app/components/Breadcrumbs.tsx
git commit -m "feat(content): add visual breadcrumbs component"
```

---

### Task 9: MDX component overrides

**Files:**
- Create: `app/components/mdxComponents.tsx`

**Interfaces:**
- Consumes: `MDXComponents` type from `mdx/types` (ships transitively via `next-mdx-remote`'s `@mdx-js/mdx` dependency — this is the same type the official Next.js MDX docs use for `mdx-components.tsx`)
- Produces: `mdxComponents: MDXComponents`

No unit test (JSX components). Verified in Task 13 via the rendered test page.

- [ ] **Step 1: Write the component map**

Create `app/components/mdxComponents.tsx`:
```tsx
import Link from "next/link";
import Image from "next/image";
import type { MDXComponents } from "mdx/types";
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from "react";

function MdxLink({ href = "", children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  );
}

function MdxImage({ src, alt, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  if (!src) return null;
  return (
    <Image
      src={src}
      alt={alt ?? ""}
      width={1200}
      height={630}
      sizes="100vw"
      style={{ width: "100%", height: "auto" }}
      {...props}
    />
  );
}

export const mdxComponents: MDXComponents = {
  a: MdxLink,
  img: MdxImage,
};
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors. If `mdx/types` can't be resolved (some package managers don't hoist transitive type-only packages), run `npm install -D @types/mdx` and re-check — this is the same package the Next.js docs install explicitly for the native `@next/mdx` path, so it's safe to add here too if needed.

- [ ] **Step 3: Commit**

```bash
git add app/components/mdxComponents.tsx
git commit -m "feat(content): add MDX component overrides for links and images"
```

---

### Task 10: Tailwind Typography plugin

**Files:**
- Modify: `app/globals.css`

**Interfaces:** none (CSS-only change)

- [ ] **Step 1: Register the plugin**

In `app/globals.css`, the file currently starts with:
```css
@import "tailwindcss";
@import "tw-animate-css";
```
Change to:
```css
@import "tailwindcss";
@import "tw-animate-css";
@plugin "@tailwindcss/typography";
```

- [ ] **Step 2: Verify the dev server starts without CSS errors**

Run: `npm run dev` (start it, confirm no Tailwind/PostCSS error in the terminal output, then stop it — full page verification happens in Task 13 once there's a page using `prose`).

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(content): register Tailwind Typography plugin"
```

---

### Task 11: Shared `ContentPage` renderer

**Files:**
- Create: `app/components/ContentPage.tsx`

**Interfaces:**
- Consumes:
  - `getContentBySlug`, `getAllContentAcrossCollections` from `@/lib/content` (Task 5)
  - `Collection` from `@/lib/content/schema` (Task 2)
  - `estimateReadingTime` from `@/lib/content/reading-time` (Task 3)
  - `resolveRelatedPageLabel` from `@/lib/content/related-pages` (Task 4)
  - `ArticleJsonLd`, `FAQPageJsonLd`, `BreadcrumbJsonLd` from `./JsonLd` (Task 7; `FAQPageJsonLd` already existed)
  - `Breadcrumbs` from `./Breadcrumbs` (Task 8)
  - `mdxComponents` from `./mdxComponents` (Task 9)
  - `MDXRemote` from `next-mdx-remote/rsc`
- Produces: `ContentPage({ collection, slug }: { collection: Collection; slug: string }): JSX.Element`, used by all four route pages in Task 12.

No unit test (Server Component composition — App Router rendering isn't covered by the vitest/node setup added in Task 1). Verified end-to-end in Task 13.

- [ ] **Step 1: Write the component**

Create `app/components/ContentPage.tsx`:
```tsx
import { MDXRemote } from "next-mdx-remote/rsc";
import { getContentBySlug, getAllContentAcrossCollections } from "@/lib/content";
import type { Collection } from "@/lib/content/schema";
import { estimateReadingTime } from "@/lib/content/reading-time";
import { resolveRelatedPageLabel } from "@/lib/content/related-pages";
import { ArticleJsonLd, FAQPageJsonLd, BreadcrumbJsonLd } from "./JsonLd";
import { Breadcrumbs } from "./Breadcrumbs";
import { mdxComponents } from "./mdxComponents";

const BASE_URL = "https://sahla.co";

const COLLECTION_LABELS: Record<Collection, string> = {
  resources: "Resources",
  glossary: "Glossary",
  vs: "Compare",
  features: "Features",
};

export function ContentPage({ collection, slug }: { collection: Collection; slug: string }) {
  const { meta, body } = getContentBySlug(collection, slug);
  const allContent = getAllContentAcrossCollections();
  const url = `${BASE_URL}${meta.path}`;
  const readingMinutes = estimateReadingTime(body);
  const updatedLabel = new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(
    new Date(meta.updatedAt)
  );

  // No index page exists yet for any of the four collections, so the
  // collection breadcrumb has no `url` — both BreadcrumbJsonLd and
  // Breadcrumbs render an item without `url` as plain, non-linked text
  // rather than pointing at a page that doesn't exist.
  const breadcrumbItems = [
    { name: "Home", url: `${BASE_URL}/` },
    { name: COLLECTION_LABELS[collection] },
    { name: meta.title, url },
  ];

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      {meta.schema === "FAQPage" ? (
        <FAQPageJsonLd faqs={meta.faqs!.map((faq) => ({ q: faq.q, a: faq.a }))} />
      ) : (
        <ArticleJsonLd
          headline={meta.title}
          description={meta.description}
          datePublished={meta.publishedAt}
          dateModified={meta.updatedAt}
          url={url}
        />
      )}

      <Breadcrumbs items={breadcrumbItems} />

      <h1 className="font-[family-name:var(--font-hero)] text-4xl text-dark-green">
        {meta.title}
      </h1>
      <p className="mt-2 text-[13px] text-dark-green/55">
        Updated {updatedLabel} · {readingMinutes} min read
      </p>

      <div
        className="prose mt-8 max-w-none prose-headings:font-[family-name:var(--font-hero)]
          prose-headings:text-dark-green prose-p:text-dark-green/80 prose-a:text-accent
          prose-a:no-underline hover:prose-a:underline prose-strong:text-dark-green
          prose-blockquote:border-accent prose-blockquote:text-dark-green/70
          prose-li:text-dark-green/80 prose-code:text-dark-green"
      >
        <MDXRemote source={body} components={mdxComponents} />
      </div>

      {meta.relatedPages.length > 0 && (
        <aside className="mt-16 border-t border-edge pt-8">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.18em] text-dark-green/55">
            Related
          </h2>
          <ul className="mt-4 flex flex-col gap-2">
            {meta.relatedPages.map((pagePath) => (
              <li key={pagePath}>
                <a href={pagePath} className="text-accent hover:underline">
                  {resolveRelatedPageLabel(pagePath, allContent)}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add app/components/ContentPage.tsx
git commit -m "feat(content): add shared ContentPage renderer"
```

---

### Task 12: Four dynamic routes

**Files:**
- Create: `app/resources/[slug]/page.tsx`
- Create: `app/glossary/[term]/page.tsx`
- Create: `app/vs/[competitor]/page.tsx`
- Create: `app/features/[feature]/page.tsx`

**Interfaces:**
- Consumes: `getAllContentMeta`, `getContentBySlug` from `@/lib/content` (Task 5); `ContentPage` from `@/app/components/ContentPage` (Task 11)

No unit test (Next.js route files — `generateStaticParams`/`generateMetadata` are framework-invoked, not directly callable in a way worth mocking). Verified in Task 13.

- [ ] **Step 1: Create the resources route**

Create `app/resources/[slug]/page.tsx`:
```tsx
import type { Metadata } from "next";
import { getAllContentMeta, getContentBySlug } from "@/lib/content";
import { ContentPage } from "@/app/components/ContentPage";

export function generateStaticParams() {
  return getAllContentMeta("resources").map((meta) => ({ slug: meta.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { meta } = getContentBySlug("resources", slug);
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: "./" },
  };
}

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ContentPage collection="resources" slug={slug} />;
}
```

- [ ] **Step 2: Create the glossary route**

Create `app/glossary/[term]/page.tsx`:
```tsx
import type { Metadata } from "next";
import { getAllContentMeta, getContentBySlug } from "@/lib/content";
import { ContentPage } from "@/app/components/ContentPage";

export function generateStaticParams() {
  return getAllContentMeta("glossary").map((meta) => ({ term: meta.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ term: string }>;
}): Promise<Metadata> {
  const { term } = await params;
  const { meta } = getContentBySlug("glossary", term);
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: "./" },
  };
}

export default async function GlossaryPage({
  params,
}: {
  params: Promise<{ term: string }>;
}) {
  const { term } = await params;
  return <ContentPage collection="glossary" slug={term} />;
}
```

- [ ] **Step 3: Create the vs route**

Create `app/vs/[competitor]/page.tsx`:
```tsx
import type { Metadata } from "next";
import { getAllContentMeta, getContentBySlug } from "@/lib/content";
import { ContentPage } from "@/app/components/ContentPage";

export function generateStaticParams() {
  return getAllContentMeta("vs").map((meta) => ({ competitor: meta.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ competitor: string }>;
}): Promise<Metadata> {
  const { competitor } = await params;
  const { meta } = getContentBySlug("vs", competitor);
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: "./" },
  };
}

export default async function VsPage({
  params,
}: {
  params: Promise<{ competitor: string }>;
}) {
  const { competitor } = await params;
  return <ContentPage collection="vs" slug={competitor} />;
}
```

- [ ] **Step 4: Create the features route**

Create `app/features/[feature]/page.tsx`:
```tsx
import type { Metadata } from "next";
import { getAllContentMeta, getContentBySlug } from "@/lib/content";
import { ContentPage } from "@/app/components/ContentPage";

export function generateStaticParams() {
  return getAllContentMeta("features").map((meta) => ({ feature: meta.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ feature: string }>;
}): Promise<Metadata> {
  const { feature } = await params;
  const { meta } = getContentBySlug("features", feature);
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: "./" },
  };
}

export default async function FeaturePage({
  params,
}: {
  params: Promise<{ feature: string }>;
}) {
  const { feature } = await params;
  return <ContentPage collection="features" slug={feature} />;
}
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors. (There is nothing in any collection folder yet, so `generateStaticParams` returns `[]` for all four routes at this point — that's expected until Task 13 adds the first file.)

- [ ] **Step 6: Commit**

```bash
git add app/resources app/glossary app/vs app/features
git commit -m "feat(content): add resources/glossary/vs/features dynamic routes"
```

---

### Task 13: Test content page — `/features/prayer-times`

**Files:**
- Create: `content/features/prayer-times.mdx`

**Interfaces:** none — this is the content file that exercises every piece built in Tasks 2–12.

- [ ] **Step 1: Write the content file**

Create `content/features/prayer-times.mdx`. Content is drawn from copy already live elsewhere on the site (`app/global/GlobalContent.tsx`, `app/components/Features.tsx`, `app/components/ThreeProblems.tsx`) — 14 calculation methods, daily athan/iqamah recalculation, per-user push notification settings, any-timezone support:

```mdx
---
title: "Prayer Times & Iqamah in Your Mosque's Own App"
description: "How Sahla calculates and displays prayer times: 14 calculation methods, daily athan and iqamah recalculation, and per-prayer push notifications, in any timezone."
publishedAt: "2026-09-19"
updatedAt: "2026-09-19"
schema: "Article"
relatedPages: ["/pricing", "/why-sahla"]
---

Every Sahla app shows accurate prayer times for your mosque's exact location, calculated fresh every day, with no manual updates required.

## Fourteen calculation methods

Your mosque's address feeds into all 14 standard calculation methods, including ISNA, MWL, Karachi, Umm al-Qura, and Diyanet. Athan and iqamah times are recalculated daily for your location, in any timezone on earth.

## Iqamah, kept in sync

Iqamah times are set by your mosque and stay in sync across every member's app in real time.

## Notifications your community actually wants

Members get per-prayer push notifications, configurable per user, so nobody gets an alert for a prayer they've already prayed or don't want reminders for.

## Built for every timezone

Whether your congregation is in New York, London, Dubai, or Tokyo, Sahla calculates prayer times automatically for that exact location — no manual entry, no drift.
```

- [ ] **Step 2: Run the dev server**

Run: `npm run dev`

- [ ] **Step 3: Verify the page renders with no code changes beyond the content file**

Navigate to `http://localhost:3000/features/prayer-times`. Confirm:
- The page renders with the title, breadcrumbs (`Home / Features / Prayer Times & Iqamah in Your Mosque's Own App`), an "Updated [date] · N min read" line, the four headings, and a "Related" section linking to `/pricing` ("Pricing") and `/why-sahla` ("Why Sahla").
- No route file, component, or config was touched to make this page appear — only `content/features/prayer-times.mdx` was added.

- [ ] **Step 4: Verify canonical URL and metadata via view-source**

View source (or `curl -s http://localhost:3000/features/prayer-times | grep -E "canonical|<title"`) and confirm:
- `<link rel="canonical" href="https://sahla.co/features/prayer-times">`
- `<title>Prayer Times & Iqamah in Your Mosque's Own App | Sahla</title>`

- [ ] **Step 5: Verify JSON-LD via view-source**

In the same page source, confirm two `<script type="application/ld+json">` blocks are present: one `"@type": "BreadcrumbList"` with two `item` entries (Home and the page itself — the middle "Features" entry has no `item` key) and one `"@type": "Article"` with `headline`, `description`, `datePublished`, `dateModified`, and `url` all populated from the frontmatter.

- [ ] **Step 6: Verify the sitemap includes the new page**

Run: `curl -s http://localhost:3000/sitemap.xml | grep prayer-times`
Expected: one `<url>` entry for `https://sahla.co/features/prayer-times` with `<lastmod>2026-09-19...`.

- [ ] **Step 7: Run the full test suite one more time**

Run: `npm test`
Expected: all tests from Tasks 2–6 still PASS (adding real content doesn't change any pure-logic behavior).

- [ ] **Step 8: Run a production build**

Run: `npm run build`
Expected: build succeeds, and the build output lists `/features/prayer-times` as a statically generated route.

- [ ] **Step 9: Note the Rich Results Test limitation**

Google's Rich Results Test (https://search.google.com/test/rich-results) requires a publicly reachable URL — it cannot validate `localhost`. Once this branch is deployed, run the live `https://sahla.co/features/prayer-times` URL through that tool and confirm the `Article` type is recognized with no errors. This is a manual follow-up after deploy, not something this task can complete locally.

- [ ] **Step 10: Commit**

```bash
git add content/features/prayer-times.mdx
git commit -m "feat(content): add prayer-times test page for the MDX content system"
```

---

## Definition of Done (from the ticket)

- [x] Adding a `.mdx` file to `content/<collection>/` creates a live page with no code changes — proven by Task 13 adding only a content file.
- [x] Canonical URL is correct — Task 13, Step 4.
- [x] Page appears in `sitemap.xml` automatically — Task 13, Step 6.
- [x] Breadcrumbs are correct — Task 13, Steps 3 and 5.
- [ ] Page passes Google Rich Results Test — requires a public deploy; see Task 13, Step 9.
- [x] One example page is live — `/features/prayer-times`, Task 13.
