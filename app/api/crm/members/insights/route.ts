import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireCrmAccess } from "@/lib/supabase/requireCrmAccess";
import {
  aggregateInsights,
  emptyInsights,
  parseSegment,
  type EnrichedMember,
  type PopularItem,
} from "./shared";

/**
 * Aggregated member-analytics payload for one mosque, scoped to the requested
 * `?segment=`. Aggregation happens server-side (via the shared
 * `aggregateInsights`) so (a) no per-member demographic row reaches the client
 * and (b) the spec's <5 cohort suppression is enforced before data leaves the
 * server — privacy is structural, not cosmetic.
 *
 * Every member-relative count is anchored to one shared member set: the users
 * with a `user_preferences` row for this mosque — the SAME definition the
 * Members list (`/api/crm/members`) uses, so the two screens never disagree.
 */

type PrefRow = {
  user_id: string;
  gender: string | null;
  birth_year: number | null;
  is_revert: boolean | null;
  has_children: boolean | null;
  profiles: { created_at: string | null } | null;
};

function normalizeGender(raw: string | null): EnrichedMember["gender"] {
  if (raw == null || raw.trim() === "") return null;
  const g = raw.trim().toLowerCase();
  if (g === "male" || g === "m") return "male";
  if (g === "female" || g === "f") return "female";
  return "other";
}

export async function GET(request: Request) {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;

  const segment = parseSegment(new URL(request.url).searchParams.get("segment"));

  // HQ has no single mosque to aggregate — the client falls back to the
  // illustrative seed for previews.
  if (access.isHQ) {
    return NextResponse.json(emptyInsights(segment));
  }

  const supabase = createAdminSupabaseClient();
  const mosqueId = access.mosqueId;

  // Member set — users with a user_preferences row for this mosque.
  const { data: prefRows, error: prefErr } = await supabase
    .from("user_preferences")
    .select(
      "user_id, gender, birth_year, is_revert, has_children, profiles!user_preferences_user_id_fkey ( created_at )"
    )
    .eq("mosque_id", mosqueId);

  if (prefErr) {
    return NextResponse.json({ error: prefErr.message }, { status: 500 });
  }

  const rows = (prefRows as unknown as PrefRow[] | null) ?? [];
  const memberIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
  const guard = memberIds.length > 0 ? memberIds : ["__none__"];

  // Reachability + interactions, fetched in bulk.
  const [pushRes, notifRes, prayerRes, contentRes, savesRes] = await Promise.all([
    supabase
      .from("push_tokens")
      .select("user_id")
      .eq("mosque_id", mosqueId)
      .eq("is_active", true)
      .in("user_id", guard),
    supabase
      .from("user_notification_preferences")
      .select("user_id, new_programs_enabled, event_reminders_enabled")
      .eq("mosque_id", mosqueId)
      .in("user_id", guard),
    supabase
      .from("prayer_notification_settings")
      .select("user_id, notification_settings")
      .eq("mosque_id", mosqueId)
      .in("user_id", guard),
    supabase
      .from("content_items")
      .select("content_id, name, type")
      .eq("mosque_id", mosqueId)
      .in("type", ["program", "event"]),
    supabase.from("saved_content").select("content_id").eq("mosque_id", mosqueId),
  ]);

  const pushUsers = new Set(
    ((pushRes.data as { user_id: string }[] | null) ?? []).map((r) => r.user_id)
  );
  const programUsers = new Set<string>();
  const eventUsers = new Set<string>();
  for (const r of ((notifRes.data as {
    user_id: string;
    new_programs_enabled: boolean;
    event_reminders_enabled: boolean;
  }[] | null) ?? [])) {
    if (r.new_programs_enabled) programUsers.add(r.user_id);
    if (r.event_reminders_enabled) eventUsers.add(r.user_id);
  }
  const prayerUsers = new Set<string>();
  for (const r of ((prayerRes.data as {
    user_id: string;
    notification_settings: string[] | null;
  }[] | null) ?? [])) {
    if ((r.notification_settings?.length ?? 0) > 0) prayerUsers.add(r.user_id);
  }

  // Normalize each member into the unit aggregateInsights rolls up. A member
  // with no notification/push row counts as not-reachable for that channel.
  const enriched: EnrichedMember[] = rows.map((r) => ({
    gender: normalizeGender(r.gender),
    birthYear: r.birth_year ?? null,
    isRevert: r.is_revert ?? null,
    hasChildren: r.has_children ?? null,
    pushEnabled: pushUsers.has(r.user_id),
    programOn: programUsers.has(r.user_id),
    eventOn: eventUsers.has(r.user_id),
    prayerOn: prayerUsers.has(r.user_id),
    createdAtMs: r.profiles?.created_at
      ? new Date(r.profiles.created_at).getTime()
      : null,
  }));

  // Most popular programs & events by saves (mosque-wide, incl. 0-save items).
  const saveCounts = new Map<string, number>();
  for (const row of ((savesRes.data as { content_id: string }[] | null) ?? [])) {
    saveCounts.set(row.content_id, (saveCounts.get(row.content_id) ?? 0) + 1);
  }
  const popular: PopularItem[] = (
    (contentRes.data as { content_id: string; name: string | null; type: string }[] | null) ??
    []
  )
    .map((ci) => ({
      name: ci.name ?? "Untitled",
      type: ci.type,
      saves: saveCounts.get(ci.content_id) ?? 0,
    }))
    .sort((a, b) => b.saves - a.saves)
    .slice(0, 5);

  const payload = aggregateInsights(
    enriched,
    segment,
    popular,
    Date.now(),
    new Date().getFullYear()
  );

  return NextResponse.json(payload);
}
