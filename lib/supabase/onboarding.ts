import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Set an onboarding step's completion to a specific value. The sidebar
 * reads `onboarding_progress[stepKey] === true` as "done", so writing
 * `false` un-checks it — used when the criterion that marked the step
 * complete is no longer met (e.g. the last speaker was deleted).
 */
export async function setOnboardingStep(
  supabase: SupabaseClient,
  mosqueId: string,
  stepKey: string,
  value: boolean
): Promise<void> {
  const { data: mosque } = await supabase
    .from("mosques")
    .select("onboarding_progress")
    .eq("id", mosqueId)
    .single();

  const progress = (mosque?.onboarding_progress as Record<string, boolean>) || {};
  progress[stepKey] = value;

  await supabase
    .from("mosques")
    .update({ onboarding_progress: progress })
    .eq("id", mosqueId);
}

/** Back-compat alias — `setOnboardingStep(..., true)`. */
export async function markOnboardingStep(
  supabase: SupabaseClient,
  mosqueId: string,
  stepKey: string
): Promise<void> {
  return setOnboardingStep(supabase, mosqueId, stepKey, true);
}
