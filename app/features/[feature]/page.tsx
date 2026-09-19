import type { Metadata } from "next";
import { getAllContentMeta, getContentBySlug } from "@/lib/content";
import { ContentPage } from "@/app/components/ContentPage";

export function generateStaticParams() {
  return getAllContentMeta("features").map((meta) => ({ feature: meta.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ feature: string }>;
}): Promise<Metadata> {
  const { feature } = await params;
  const { meta } = getContentBySlug("features", feature);
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: "./" },
  };
}

export default async function FeaturePage({
  params,
}: {
  params: Promise<{ feature: string }>;
}) {
  const { feature } = await params;
  return <ContentPage collection="features" slug={feature} />;
}
