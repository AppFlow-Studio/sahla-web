# Writing content pages

Drop an `.mdx` file into one of the folders below and it becomes a live page —
no code changes, no route to register. The file name is the URL slug.

| Folder               | URL                    | What goes here                                  |
| -------------------- | ---------------------- | ----------------------------------------------- |
| `content/resources/` | `/resources/<slug>`    | Guides, how-tos, longer explainers               |
| `content/glossary/`  | `/glossary/<slug>`     | Single-term definitions ("iqamah", "khutbah")    |
| `content/vs/`        | `/vs/<slug>`           | Sahla compared against one named alternative     |
| `content/features/`  | `/features/<slug>`     | One Sahla capability, explained in depth         |

File names must be lowercase letters, digits and hyphens only
(`prayer-times.mdx` → `/features/prayer-times`). Anything else is ignored by
the router and will 404.

Each page automatically gets: the `<title>` and meta description, a canonical
URL, Open Graph / Twitter tags, JSON-LD structured data, a `sitemap.xml` entry,
breadcrumbs, a reading-time estimate, and a "Related" list.

## Frontmatter

Every file starts with a YAML block between `---` lines. **Quote every value.**
An unquoted date is parsed by YAML as a date object rather than text and the
build will reject it.

```mdx
---
title: "Prayer Times & Iqamah in Your Mosque's Own App"
description: "How Sahla calculates and displays prayer times: 14 calculation methods, daily athan and iqamah recalculation, and per-prayer push notifications."
publishedAt: "2026-09-19"
updatedAt: "2026-09-19"
schema: "Article"
relatedPages: ["/pricing", "/why-sahla"]
---

Your first paragraph starts here. Don't repeat the title as an `# h1` — the
page renders `title` as the heading already. Start your sections at `##`.
```

| Field          | Required                      | Format                                                                                                                |
| -------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `title`        | yes                           | Non-empty string. Becomes the `<h1>`, the browser title (` \| Sahla` is appended), the og:title, and the JSON-LD headline. |
| `description`  | yes                           | Non-empty string. The search-result snippet — write it for a human, ~150 characters.                                     |
| `publishedAt`  | yes                           | `"YYYY-MM-DD"`, quoted. Must be a real calendar date; `"2026-09-31"` and `"Sept 19 2026"` both fail the build.           |
| `updatedAt`    | yes                           | `"YYYY-MM-DD"`, quoted. Shown as "Updated …" on the page and used as the sitemap's `<lastmod>`. Bump it on every edit.   |
| `schema`       | yes                           | Exactly `"Article"` or `"FAQPage"` — nothing else is supported.                                                          |
| `faqs`         | only when `schema: "FAQPage"` | Non-empty list of `{ q, a }` pairs, both non-empty strings. Omit the field entirely for `"Article"`.                     |
| `relatedPages` | no (defaults to `[]`)         | List of site-relative paths, e.g. `["/pricing", "/vs/masjidal"]`. Leading slash required; no external URLs.              |

### `Article` vs `FAQPage`

`schema` picks which structured data Google is given for the page. Use
`"Article"` for anything written as prose — that's almost everything. Use
`"FAQPage"` only when the page really is a list of questions and answers, and
then list those same questions in `faqs` so Google can show them:

```mdx
---
title: "Mosque App Pricing Questions"
description: "Common questions about what a Sahla app costs."
publishedAt: "2026-09-19"
updatedAt: "2026-09-19"
schema: "FAQPage"
faqs:
  - q: "Is there a setup fee?"
    a: "No. The monthly price is the whole cost."
  - q: "Can we cancel anytime?"
    a: "Yes, month to month."
relatedPages: ["/pricing"]
---
```

The `faqs` entries feed the structured data only — write the visible Q&A in the
body of the page as well.

### `relatedPages`

Each path becomes a link in the "Related" list at the bottom of the page. If
the path points at another content file, its real `title` is used as the link
text; otherwise the last URL segment is humanized (`/why-sahla` → "Why Sahla").
Paths aren't checked for existence, so proofread them.

## Body

Standard Markdown: `##`/`###` headings, `**bold**`, lists, links, tables,
blockquotes, code fences. Links starting with `/` become client-side navigation
automatically; external links open in a new tab. Images use normal Markdown
syntax and are rendered responsively — always write alt text.

## If the build fails

A file with bad frontmatter fails the build on purpose, with a message naming
the file and the field, e.g.
`Invalid frontmatter in features/prayer-times.mdx: publishedAt: Invalid ISO date`.
Fix the named field and rebuild.

## One safety note

`.mdx` files compile to server-side React, so they carry the same trust level
as a `.tsx` file — review a content contribution the way you'd review code, not
the way you'd proofread prose.
