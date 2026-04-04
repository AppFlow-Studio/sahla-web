import type { SupabaseClient } from "@supabase/supabase-js";

export async function markOnboardingStep(
  supabase: SupabaseClient,
  mosqueId: string,
  stepKey: string
): Promise<void> {
  const { data: mosque } = await supabase
    .from("mosques")
    .select("onboarding_progress")
    .eq("id", mosqueId)
    .single();

  const progress = (mosque?.onboarding_progress as Record<string, boolean>) || {};
  progress[stepKey] = true;

  await supabase
    .from("mosques")
    .update({ onboarding_progress: progress })
    .eq("id", mosqueId);
}
