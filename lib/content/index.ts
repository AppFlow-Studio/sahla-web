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
