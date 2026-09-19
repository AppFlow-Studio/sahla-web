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
