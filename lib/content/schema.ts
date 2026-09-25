import { z } from "zod";

export const COLLECTIONS = ["resources", "glossary", "vs", "features"] as const;
export type Collection = (typeof COLLECTIONS)[number];

const faqSchema = z.object({
  q: z.string().min(1),
  a: z.string().min(1),
});

// Calendar-accurate "YYYY-MM-DD" only (zod 4 rejects e.g. "2026-09-31"). These
// dates end up in sitemap.xml's <lastmod> and in JSON-LD datePublished /
// dateModified, where an unparseable value is worse than a missing one — so a
// malformed date fails the build instead of rendering "Invalid Date".
const isoDate = z.iso.date();

export const frontmatterSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().min(1),
    publishedAt: isoDate,
    updatedAt: isoDate,
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
