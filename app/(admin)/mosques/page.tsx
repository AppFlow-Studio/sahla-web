import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import MosqueList from "./MosqueList";

export default async function MosquesPage() {
  const supabase = createAdminSupabaseClient();

  const { data: mosques } = await supabase
    .from("mosques")
    .select(
      `
      id,
      name,
      city,
      onboarding_status,
      onboarding_progress,
      pipeline_stages (
        stage,
        contact_name
      )
    `
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl text-tan-light">Mosques</h1>
        <p className="mt-1 text-sm text-tan-muted">
          All onboarded mosques. Manage community centers and their apps.
        </p>
      </div>
      <MosqueList mosques={mosques ?? []} />
    </div>
  );
}
