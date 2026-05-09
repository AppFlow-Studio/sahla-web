import ContentDetailClient from "../../_components/ContentDetailClient";

export const metadata = {
  title: "Program · Mosque CRM",
};

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ContentDetailClient id={id} />;
}
