import { cache } from "react";
import { createAdminSupabaseClient } from "./admin";

/**
 * Resolve a Clerk `orgId` to the `mosques.id` text PK.
 *
 * - Wrapped in `cache()` so multiple server components / API routes
 *   sharing a request only hit Supabase once.
 * - Returns `null` if no mosque row exists for the org (caller decides
 *   what to do — typically redirect to `/onboarding`).
 * - Service-role client; manual auth is the convention in this codebase
 *   (see `app/(masjid)/data.ts` for the same pattern).
 */
export const resolveMosqueId = cache(async (orgId: string | null | undefined): Promise<string | null> => {
  if (!orgId) return null;

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("mosques")
    .select("id")
    .eq("clerk_org_id", orgId)
    .maybeSingle();

  if (error) {
    console.error("resolveMosqueId failed:", error.message);
    return null;
  }

  return data?.id ?? null;
});
