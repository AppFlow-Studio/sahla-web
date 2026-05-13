import ContentDetailClient from "../../_components/ContentDetailClient";

export const metadata = {
  title: "Event · Mosque CRM",
};

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ContentDetailClient id={id} />;
}
