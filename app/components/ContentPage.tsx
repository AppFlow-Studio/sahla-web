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
