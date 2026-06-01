import { cache } from "react";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * Self-heal `onboarding_progress` based on actual content presence. CRM-side
 * inserts (speakers, programs, events, categories, reels) skip the onboarding
 * progress flip, and a few panels gate `markComplete` on stale local state
 * (e.g. ProgramsPanel requires `programs.length >= 2`). The end result is
 * admins who clearly have data still see "incomplete" task cards.
 *
 * Reconciliation runs on every read; it only sets flags TRUE (never clears),
 * and writes back to the DB when anything diverges so other consumers (the
 * go-live route, sidebar headers, etc.) stay consistent without a refresh.
 */
const CONTENT_TASK_KEYS = [
  "speakers",
  "programs",
  "events",
  "categories",
  "reels",
] as const;

export const getMosqueOnboardingData = cache(async (orgId: string) => {
  const supabase = createAdminSupabaseClient();
  const { data: mosque } = await supabase
    .from("mosques")
    .select("id, name, address, city, state, phone, email, timezone, app_name, logo_url, brand_color, accent_color, secondary_color, calculation_method, school, midnight_mode, latitude_adjustment_method, prayer_tune, shafaq, reels_scope, onboarding_progress, onboarding_status, stripe_account_id, subscription_status")
    .eq("clerk_org_id", orgId)
    .single();

  if (!mosque) return mosque;

  // Count any rows present for each content task in parallel.
  const [speakersRes, programsRes, eventsRes, categoriesRes, reelsRes] =
    await Promise.all([
      supabase
        .from("speaker_data")
        .select("speaker_id", { count: "exact", head: true })
        .eq("mosque_id", mosque.id),
      supabase
        .from("content_items")
        .select("id", { count: "exact", head: true })
        .eq("mosque_id", mosque.id)
        .eq("type", "program"),
      supabase
        .from("content_items")
        .select("id", { count: "exact", head: true })
        .eq("mosque_id", mosque.id)
        .eq("type", "event"),
      supabase
        .from("display_categories")
        .select("id", { count: "exact", head: true })
        .eq("mosque_id", mosque.id),
      supabase
        .from("reels")
        .select("reel_id", { count: "exact", head: true })
        .eq("mosque_id", mosque.id),
    ]);

  const derived: Record<(typeof CONTENT_TASK_KEYS)[number], boolean> = {
    speakers: (speakersRes.count ?? 0) > 0,
    programs: (programsRes.count ?? 0) > 0,
    events: (eventsRes.count ?? 0) > 0,
    categories: (categoriesRes.count ?? 0) > 0,
    reels: (reelsRes.count ?? 0) > 0,
  };

  const stored = (mosque.onboarding_progress as Record<string, unknown>) ?? {};
  const merged: Record<string, unknown> = { ...stored };
  let changed = false;
  for (const key of CONTENT_TASK_KEYS) {
    if (derived[key] && !stored[key]) {
      merged[key] = true;
      changed = true;
    }
  }

  if (changed) {
    // Await the writeback. We used to fire-and-forget for perf, but Next's
    // response-sent lifecycle was killing the in-flight promise before the
    // UPDATE actually committed, leaving the DB out of sync. The cost is one
    // tiny round-trip on requests where reconciliation changes something.
    await supabase
      .from("mosques")
      .update({ onboarding_progress: merged })
      .eq("id", mosque.id);
  }

  return { ...mosque, onboarding_progress: merged };
});
