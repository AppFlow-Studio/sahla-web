import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { getAllContentMeta, getContentBySlugOrNull } from "@/lib/content";
import { ContentPage } from "@/app/components/ContentPage";

export function generateStaticParams() {
  return getAllContentMeta("resources").map((meta) => ({ slug: meta.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const content = getContentBySlugOrNull("resources", slug);
  if (!content) notFound();
  const { meta } = content;

  // Next merges `openGraph` and `twitter` as whole trees: a page that sets
  // either one replaces the root layout's version entirely, so the shared
  // fields (site name, locale, images) have to be restated here — otherwise
  // setting an og:title would silently drop the site's og:image.
  const inherited = await parent;

  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: "./" },
    openGraph: {
      type: "article",
      siteName: "Sahla",
      url: "./",
      locale: "en_US",
      title: meta.title,
      description: meta.description,
      publishedTime: meta.publishedAt,
      modifiedTime: meta.updatedAt,
      images: inherited.openGraph?.images ?? [],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: inherited.twitter?.images ?? [],
    },
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
