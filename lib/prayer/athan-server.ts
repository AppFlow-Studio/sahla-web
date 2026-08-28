import type { SupabaseClient } from "@supabase/supabase-js";
import type { PrayerName } from "./types";
import { localDay } from "./timezone";

/**
 * Reads the mosque's athan times into a `prayer_name → 'HH:MM:SS'` map, used to
 * validate that fixed iqamah times aren't set before athan.
 *
 * Prefers today's row (in the mosque's own timezone); falls back to whatever athan rows exist for
 * the mosque if today hasn't been synced yet. Day-to-day athan drift is ~1 min,
 * so the fallback is fine for a sanity check. When the mosque has no synced
 * athan at all the map is empty and validation is skipped by the caller.
 */
export async function fetchAthanByPrayer(
  supabase: SupabaseClient,
  mosqueId: string
): Promise<Partial<Record<PrayerName, string>>> {
  const { data: mosque } = await supabase
    .from("mosques")
    .select("timezone")
    .eq("id", mosqueId)
    .single();
  const today = localDay(mosque?.timezone).iso;

  let rows: { prayer_name: string; athan_time: string }[] | null = null;

  const todayRes = await supabase
    .from("todays_prayers")
    .select("prayer_name, athan_time")
    .eq("mosque_id", mosqueId)
    .eq("date", today);
  rows = todayRes.data;

  if (!rows?.length) {
    const anyRes = await supabase
      .from("todays_prayers")
      .select("prayer_name, athan_time")
      .eq("mosque_id", mosqueId);
    rows = anyRes.data;
  }

  const map: Partial<Record<PrayerName, string>> = {};
  for (const r of rows ?? []) {
    const key = r.prayer_name as PrayerName;
    // First occurrence wins — avoids mixing multiple dates from the fallback.
    if (r.athan_time && !(key in map)) map[key] = r.athan_time;
  }
  return map;
}
