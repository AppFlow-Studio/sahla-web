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
