import type { Metadata } from "next";
import { getAllContentMeta, getContentBySlug } from "@/lib/content";
import { ContentPage } from "@/app/components/ContentPage";

export function generateStaticParams() {
  return getAllContentMeta("resources").map((meta) => ({ slug: meta.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { meta } = getContentBySlug("resources", slug);
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: "./" },
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
