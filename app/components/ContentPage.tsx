import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getContentBySlugOrNull, getAllContentAcrossCollections } from "@/lib/content";
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

/**
 * Labels for a page's related links. Reading the whole content index re-parses
 * the frontmatter of every file on the site, so it only happens when the page
 * actually has related links to label.
 */
function buildRelatedLinks(relatedPages: string[]) {
  if (relatedPages.length === 0) return [];
  const allContent = getAllContentAcrossCollections();
  return relatedPages.map((pagePath) => ({
    pagePath,
    label: resolveRelatedPageLabel(pagePath, allContent),
  }));
}

export function ContentPage({ collection, slug }: { collection: Collection; slug: string }) {
  const content = getContentBySlugOrNull(collection, slug);
  if (!content) notFound();

  const { meta, body } = content;
  const url = `${BASE_URL}${meta.path}`;
  const readingMinutes = estimateReadingTime(body);
  // "2026-09-19" parses as UTC midnight, so formatting in a server timezone
  // behind UTC would render the previous calendar day.
  const updatedLabel = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(meta.updatedAt));
  const relatedLinks = buildRelatedLinks(meta.relatedPages);

  // No index page exists yet for any of the four collections, so the
  // collection breadcrumb has no `url` — the visual Breadcrumbs component
  // renders such an item as plain, non-linked text rather than pointing at a
  // page that doesn't exist.
  const breadcrumbItems = [
    { name: "Home", url: `${BASE_URL}/` },
    { name: COLLECTION_LABELS[collection] },
    { name: meta.title, url },
  ];
  // Google's BreadcrumbList spec only allows omitting `item` on the LAST
  // ListItem, so the URL-less collection entry is dropped from the structured
  // data (it stays in the visual trail above).
  const breadcrumbJsonLdItems = breadcrumbItems.filter((item) => item.url);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <BreadcrumbJsonLd items={breadcrumbJsonLdItems} />
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

      {relatedLinks.length > 0 && (
        <aside className="mt-16 border-t border-edge pt-8">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.18em] text-dark-green/55">
            Related
          </h2>
          <ul className="mt-4 flex flex-col gap-2">
            {relatedLinks.map(({ pagePath, label }) => (
              <li key={pagePath}>
                <a href={pagePath} className="text-accent hover:underline">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </main>
  );
}
