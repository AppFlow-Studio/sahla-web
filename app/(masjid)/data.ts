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
    .select("id, name, address, city, state, timezone, app_name, logo_url, brand_color, accent_color, secondary_color, calculation_method, school, onboarding_progress, stripe_account_id")
    .eq("id", orgId)
    .single();

  return mosque;
});
