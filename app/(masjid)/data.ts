import { cache } from "react";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * Fetches mosque data for the onboarding flow.
 * Wrapped in React `cache()` so that multiple server components
 * calling this within the same request share a single Supabase query.
 */
export const getMosqueOnboardingData = cache(async (orgId: string) => {
  const supabase = createAdminSupabaseClient();
  const { data: mosque } = await supabase
    .from("mosques")
    .select("id, name, onboarding_progress, brand_color")
    .eq("id", orgId)
    .single();

  return mosque;
});
