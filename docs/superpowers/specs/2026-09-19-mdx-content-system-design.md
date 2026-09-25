# MDX Content System — Design Spec

**Ticket:** SAHLA-WEB (second work group) — "add .mdx file → live page, no code changes"
**Date:** 2026-09-19
**Order dependency:** SAHLA-WEB-01 through SAHLA-WEB-07 (confirmed complete)

## Problem

~87 new marketing pages are coming (competitor comparisons, feature pages, guides,
glossary terms). Writing each as hand-coded React would take months. We need a
system where a content author drops a `.mdx` file into a folder and a fully
SEO-correct page appears: right title/description, canonical URL, JSON-LD,
sitemap entry, breadcrumbs, reading time, related pages — with zero code changes
per page.

## Approach

**gray-matter + next-mdx-remote/rsc**, chosen over native `@next/mdx`
(file-based/dynamic-import) and Contentlayer2. Rationale:

- Frontmatter must be readable cheaply and synchronously in three unrelated
  places (sitemap generation, `generateStaticParams`, related-page title
  lookup) without compiling MDX just to read YAML. `gray-matter` gives us
  `{ data, content }` from a plain `fs.readFileSync` — no bundler involvement.
- `@next/mdx`'s native path requires `remark-frontmatter` +
  `remark-mdx-frontmatter` to turn YAML into a JS export, plus
  `pageExtensions` and `mdx-components.tsx` config, plus dynamic
  `import(`@/content/${slug}.mdx`)` per route — more moving parts, and
  every metadata read means evaluating a full MDX→JSX module.
- Contentlayer2 is an unmaintained community fork of a discontinued Vercel
  project; a dedicated build-time content layer is overkill for 4
  collections and ~90 files.
- `next-mdx-remote/rsc` compiles a markdown string on the server (RSC-
  compatible) and takes the `content` string straight from `gray-matter`,
  so there's exactly one place body text is parsed.

New dependencies: `gray-matter`, `next-mdx-remote`, `@tailwindcss/typography`
(dev). Reading time is hand-rolled (word-count / 200wpm) rather than adding a
4th dependency for ~10 lines of logic.

## Content model

```
content/
  resources/*.mdx   → /resources/[slug]
  glossary/*.mdx    → /glossary/[term]
  vs/*.mdx          → /vs/[competitor]
  features/*.mdx    → /features/[feature]
```

Frontmatter shape, validated with `zod` (already a project dependency):

```ts
{
  title: string;
  description: string;
  publishedAt: string;   // ISO date
  updatedAt: string;     // ISO date
  schema: "Article" | "FAQPage";
  relatedPages: string[];        // site paths, e.g. "/pricing"
  faqs?: { q: string; a: string }[]; // required iff schema === "FAQPage"
}
```

`schema` is deliberately limited to `Article` and `FAQPage` for this first
version — these are the two types content authors will actually need
(guides/comparisons/features/glossary entries are informational, not
products). `Product`/`SoftwareApplication` remain page-specific (already
owned by `/pricing` and the root layout) rather than becoming
content-frontmatter options, since nothing in the 87-page plan needs them and
adding unused schema types now would be speculative. The zod schema refines
that `faqs` is a non-empty array whenever `schema === "FAQPage"`, so a
malformed file fails the build loudly instead of shipping broken structured
data.

## `lib/content.ts`

Pure Node/fs module, no React:

```ts
type Collection = "resources" | "glossary" | "vs" | "features";

function getAllContentMeta(collection: Collection): ContentMeta[]
// fs.readdirSync + gray-matter (frontmatter only, no body) — used by
// generateStaticParams and sitemap.ts.

function getContentBySlug(collection: Collection, slug: string):
  { meta: ContentMeta; body: string }
// meta + raw MDX body string, used by the page renderer.

function getAllContentAcrossCollections(): (ContentMeta & { collection; slug })[]
// flattened index of everything, used only for related-page title lookup.
```

`ContentMeta` = validated frontmatter + derived `slug` (filename without
`.mdx`) + derived `path` (`/${collectionRoute}/${slug}`).

## Routes

Four route files, each thin:

```
app/resources/[slug]/page.tsx
app/glossary/[term]/page.tsx
app/vs/[competitor]/page.tsx
app/features/[feature]/page.tsx
```

Each supplies only:
- `generateStaticParams` — maps `getAllContentMeta(collection)` to param objects.
- `generateMetadata` — title/description from frontmatter, `alternates: { canonical: "./" }` (matches the existing per-page canonical convention set in `app/layout.tsx`).
- A call into the shared `app/components/ContentPage.tsx`, passing `collection` and `slug`.

`ContentPage` (shared, written once) renders top to bottom:
1. Visual breadcrumbs (`Breadcrumbs.tsx`) — Home → collection label → title.
2. Title, "Updated {date} · {n} min read" line.
3. `<div className="prose ...">` wrapping `<MDXRemote source={body} components={mdxComponents} />`.
4. "Related" section from `relatedPages`.

It also emits, unconditionally, `BreadcrumbJsonLd` (existing component), and
then either `ArticleJsonLd` (new) or `FAQPageJsonLd` (existing) based on
`meta.schema`.

Collection → breadcrumb label: `resources` → "Resources", `glossary` →
"Glossary", `vs` → "Compare", `features` → "Features".

## JSON-LD

`app/components/JsonLd.tsx` already has a generic `JsonLd({type, data})`
primitive plus typed wrappers (`FAQPageJsonLd`, `BreadcrumbJsonLd`, etc.) with
an explicit house convention: prefer these over hand-written
`<script type="application/ld+json">`. This system follows that convention
rather than introducing a second way to emit structured data:

- Add `ArticleJsonLd({ headline, description, datePublished, dateModified, url })` to `JsonLd.tsx`, following the same pattern as the existing wrappers (author/publisher fixed to the Sahla `Organization`).
- Reuse `FAQPageJsonLd({ faqs })` as-is for `schema: "FAQPage"` pages, sourcing `faqs` straight from frontmatter.
- Reuse `BreadcrumbJsonLd` as-is for every content page's breadcrumb trail.

## Reading time & last updated

- Reading time: `Math.max(1, Math.ceil(wordCount(body) / 200))` minutes, where `wordCount` splits on whitespace. No dependency.
- Last updated: `new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(meta.updatedAt))`.

## Related pages

`relatedPages` is a plain array of site paths (may point at other content
pages or static pages like `/pricing`). Label resolution:

1. If the path matches an entry in `getAllContentAcrossCollections()`, use that entry's real `title`.
2. Otherwise, humanize the last path segment (kebab-case → Title Case), e.g. `/why-sahla` → "Why Sahla".

No site-wide static-page title registry is built — it isn't needed yet and
the humanized fallback is legible for the handful of static pages likely to
appear in `relatedPages`.

## Sitemap

`app/sitemap.ts` already walks `app/` for `page.tsx` files. Add
`collectContentRoutes()`, which calls `getAllContentMeta` for all four
collections and returns `{ url, lastModified: new Date(meta.updatedAt) }[]`.
The existing `sitemap()` export concatenates this with its current
file-based route list — one function, same file, same output shape.

## MDX styling

- `@tailwindcss/typography` (dev dependency) — a `prose` wrapper class handles spacing/sizing for every markdown element (tables, blockquotes, code) without hand-styling each one across ~90 pages.
- Override `prose` CSS variables to match the existing brand palette/fonts already defined in `app/layout.tsx` (Fraunces/Newsreader font stack, `#0A261E` / `#fffbf2` colors) rather than shipping Tailwind Typography's defaults unmodified.
- `mdxComponents` (passed to every `MDXRemote`) overrides:
  - `a`: internal (`href` starts with `/`) renders via `next/link`; external gets `target="_blank" rel="noopener"`.
  - `img`: renders via `next/image`.

## Test page

`/features/prayer-times`, `schema: "Article"`. Content is drawn from
copy already live elsewhere on the site (14 prayer-calculation methods
including ISNA/MWL/Karachi/Umm al-Qura/Diyanet, daily athan/iqamah
recalculation, per-prayer push notifications, works in any timezone) — no
new or unverified claims. `Article` (not `FAQPage`) was chosen for this page
specifically to avoid inventing FAQ content without source facts; the system
itself supports both schema types equally.

`relatedPages: ["/pricing", "/why-sahla"]`.

## Definition of done (from ticket)

- [ ] Adding a `.mdx` file to `content/<collection>/` creates a live page with no code changes
- [ ] Canonical URL is correct (`alternates.canonical: "./"`, matches site convention)
- [ ] Page appears in `sitemap.xml` automatically
- [ ] Breadcrumbs are correct (visual + `BreadcrumbJsonLd`)
- [ ] Page passes Google Rich Results Test (`Article` structured data on the test page)
- [ ] `/features/prayer-times` is live

## Out of scope (explicitly deferred, not part of this build)

- Table of contents / heading anchor links (not requested).
- `Product`/`SoftwareApplication`/other schema types as content frontmatter options.
- A site-wide static-page title registry for `relatedPages` labels.
- Any of the actual 87 pages beyond the one test page — this ticket is the system, not the content.
