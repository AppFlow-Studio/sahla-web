import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import matter from "gray-matter";
import { ZodError } from "zod";
import { frontmatterSchema, COLLECTIONS, type Collection, type ContentMeta } from "./schema";

const DEFAULT_CONTENT_ROOT = path.join(process.cwd(), "content");

// Slugs arrive straight off the URL, so they're attacker-controlled and must
// never be interpolated into a filesystem path unchecked. Anything outside
// this charset (`.`, `/`, `\`, NUL, …) is rejected before a path is built.
const SAFE_SLUG = /^[a-z0-9-]+$/i;

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

  let frontmatter;
  try {
    frontmatter = frontmatterSchema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      // A bare zod error names the bad field but not the bad file, which is
      // useless once there are dozens of content files in the build.
      const issues = error.issues
        .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
        .join("; ");
      throw new Error(`Invalid frontmatter in ${collection}/${filename}: ${issues}`);
    }
    throw error;
  }

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

/**
 * Reads one content file, or returns `null` when the slug is unknown or unsafe.
 *
 * Null (rather than a thrown ENOENT) is what lets every route turn a dead URL
 * into a real 404 via `notFound()` instead of a 500. Wrapped in React's
 * `cache()` so a route's `generateMetadata` and its `ContentPage` render share
 * one read per request instead of parsing the same file twice.
 */
export const getContentBySlugOrNull = cache(function getContentBySlugOrNull(
  collection: Collection,
  slug: string,
  contentRoot: string = DEFAULT_CONTENT_ROOT
): { meta: ContentMeta; body: string } | null {
  if (!SAFE_SLUG.test(slug)) return null;

  const filePath = path.join(contentRoot, collection, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  return parseFile(collection, contentRoot, `${slug}.mdx`);
});

/**
 * Every content file in every collection, flattened. Wrapped in `cache()`
 * because a single render can ask for it more than once (related-page labels,
 * the sitemap) and it re-parses the frontmatter of every file on the site.
 */
export const getAllContentAcrossCollections = cache(function getAllContentAcrossCollections(
  contentRoot: string = DEFAULT_CONTENT_ROOT
): ContentMeta[] {
  return COLLECTIONS.flatMap((collection) => getAllContentMeta(collection, contentRoot));
});
