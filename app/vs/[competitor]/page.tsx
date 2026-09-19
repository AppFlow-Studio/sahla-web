import type { Metadata } from "next";
import { getAllContentMeta, getContentBySlug } from "@/lib/content";
import { ContentPage } from "@/app/components/ContentPage";

export function generateStaticParams() {
  return getAllContentMeta("vs").map((meta) => ({ competitor: meta.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ competitor: string }>;
}): Promise<Metadata> {
  const { competitor } = await params;
  const { meta } = getContentBySlug("vs", competitor);
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: "./" },
  };
}

export default async function VsPage({
  params,
}: {
  params: Promise<{ competitor: string }>;
}) {
  const { competitor } = await params;
  return <ContentPage collection="vs" slug={competitor} />;
}
