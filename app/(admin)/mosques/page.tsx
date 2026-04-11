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
      brand_color,
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
      <div className="mb-7 flex items-center justify-between">
        <div>
          <h1 className="font-display text-[28px] font-semibold text-ink leading-tight">Mosques</h1>
          <p className="mt-1 text-[13px] text-subtle">
            All onboarded mosques. Manage community centers and their apps.
          </p>
        </div>
        <button className="rounded-xl bg-ink px-5 py-2.5 text-[13px] font-semibold text-sand shadow-sm transition-all hover:shadow-md hover:brightness-110 active:scale-[0.98]">
          + Add Mosque
        </button>
      </div>
      <MosqueList mosques={mosques ?? []} />
    </div>
  );
}
