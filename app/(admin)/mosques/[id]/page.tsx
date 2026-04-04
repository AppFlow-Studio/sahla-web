import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import MosqueDetail from "./MosqueDetail";

export default async function MosqueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminSupabaseClient();

  const [mosqueResult, notesResult, stagesResult, iqamahResult] = await Promise.all([
    supabase
      .from("mosques")
      .select("*")
      .eq("id", id)
      .single(),
    supabase
      .from("mosque_notes")
      .select("*")
      .eq("mosque_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("pipeline_stages")
      .select("*")
      .eq("mosque_id", id)
      .single(),
    supabase
      .from("iqamah_config")
      .select("*")
      .eq("mosque_id", id),
  ]);

  if (!mosqueResult.data) {
    notFound();
  }

  return (
    <MosqueDetail
      mosque={mosqueResult.data}
      notes={notesResult.data ?? []}
      pipelineStage={stagesResult.data}
      iqamahConfig={iqamahResult.data ?? []}
    />
  );
}
