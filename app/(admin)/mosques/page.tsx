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
      state,
      brand_color,
      onboarding_status,
      onboarding_progress,
      stripe_account_id,
      subscription_status,
      launched_at,
      created_at,
      pipeline_stages (
        stage,
        contact_name,
        contact_email,
        updated_at
      )
    `
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-display text-[28px] font-semibold text-ink leading-tight">Mosques</h1>
        <p className="mt-1 text-[13px] text-subtle">
          All onboarded mosques. Manage community centers and their apps.
        </p>
      </div>
      <MosqueList mosques={mosques ?? []} />
    </div>
  );
}
