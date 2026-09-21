import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireCrmAccess } from "@/lib/supabase/requireCrmAccess";
import {
  buildInsights,
  EMPTY_INSIGHTS,
  type ContentSummary,
  type EnrichedMember,
  type InterestCategory,
} from "./shared";

/**
 * The Insights page payload for one mosque: who the community is, what it says
 * it wants, how what's already on the calendar is landing, and what to run next.
 *
 * Aggregation happens here rather than on the client so (a) no per-member
 * demographic row ever reaches the browser and (b) the <5 cohort suppression is
 * enforced before data leaves the server. Privacy is structural, not cosmetic.
 *
 * The member set is the same one the Members list uses — users with a
 * `user_preferences` row for this mosque — so the two screens never disagree.
 */

const PAGE = 1000;

/** The only part of a PostgREST builder this pager needs. */
type Pageable<T> = {
  range(from: number, to: number): PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>;
};

/**
 * Read every row of a query, not just PostgREST's first 1000. A 500-member
 * mosque picking a dozen interests each blows past the default limit, and a
 * silently truncated read would quietly understate demand.
 *
 * Takes a factory rather than a builder because each page needs a fresh query.
 */
async function fetchAll<T>(build: () => unknown): Promise<{ rows: T[]; error: string | null }> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await (build() as Pageable<T>).range(from, from + PAGE - 1);
    if (error) return { rows, error: error.message };
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < PAGE) return { rows, error: null };
  }
}

/**
 * `user_preferences.gender` is free-ish text — production rows hold "male",
 * "female", "brother" and "sister" side by side because the app's wording
 * changed between releases. Fold the synonyms in, or a third of the community
 * lands in "Other" and every gender-based read is wrong.
 */
function normalizeGender(raw: string | null): EnrichedMember["gender"] {
  if (raw == null || raw.trim() === "") return null;
  const g = raw.trim().toLowerCase();
  if (g === "male" || g === "m" || g === "brother" || g === "brothers") return "male";
  if (g === "female" || g === "f" || g === "sister" || g === "sisters") return "female";
  return "other";
}

type PrefRow = {
  user_id: string;
  gender: string | null;
  birth_year: number | null;
  is_revert: boolean | null;
  has_children: boolean | null;
  children_ages: number[] | null;
  preferred_days: string[] | null;
  preferred_times: string[] | null;
  life_stage: string | null;
  profiles: { created_at: string | null } | null;
};

type ContentRow = {
  content_id: string;
  name: string | null;
  type: string;
  is_kids: boolean | null;
  is_fourteen_plus: boolean | null;
  gender: string | null;
  days: string[] | null;
  created_at: string;
  content_islamic_interests: { interest_id: number }[] | null;
};

type SaveRow = { content_id: string; user_id: string };
type InteractionRow = { content_id: string; user_id: string; interaction_type: string | null };

export async function GET() {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;

  // HQ with no mosque picked has nothing to aggregate.
  if (access.isHQ) return NextResponse.json(EMPTY_INSIGHTS);

  const supabase = createAdminSupabaseClient();
  const mosqueId = access.mosqueId;

  const [prefs, categories, content, saves, unsaves, reminders] = await Promise.all([
    fetchAll<PrefRow>(() =>
      supabase
        .from("user_preferences")
        .select(
          "user_id, gender, birth_year, is_revert, has_children, children_ages, preferred_days, preferred_times, life_stage, profiles!user_preferences_user_id_fkey ( created_at )"
        )
        .eq("mosque_id", mosqueId)
        .order("user_id", { ascending: true })
    ),
    fetchAll<{ id: number; category_key: string; category_name: string; display_order: number | null }>(
      () =>
        supabase
          .from("islamic_interest_categories")
          .select("id, category_key, category_name, display_order")
          .order("id", { ascending: true })
    ),
    fetchAll<ContentRow>(() =>
      supabase
        .from("content_items")
        .select(
          "content_id, name, type, is_kids, is_fourteen_plus, gender, days, created_at, content_islamic_interests ( interest_id )"
        )
        .eq("mosque_id", mosqueId)
        .order("created_at", { ascending: false })
    ),
    fetchAll<SaveRow>(() =>
      supabase
        .from("saved_content")
        .select("content_id, user_id")
        .eq("mosque_id", mosqueId)
        .order("content_id", { ascending: true })
    ),
    fetchAll<InteractionRow>(() =>
      supabase
        .from("user_content_interactions")
        .select("content_id, user_id, interaction_type")
        .eq("mosque_id", mosqueId)
        .eq("interaction_type", "unsave")
        .order("content_id", { ascending: true })
    ),
    fetchAll<{ content_id: string }>(() =>
      supabase
        .from("content_notifications")
        .select("content_id")
        .eq("mosque_id", mosqueId)
        .order("content_id", { ascending: true })
    ),
  ]);

  const failure =
    prefs.error ??
    categories.error ??
    content.error ??
    saves.error ??
    unsaves.error ??
    reminders.error;
  if (failure) return NextResponse.json({ error: failure }, { status: 500 });

  const memberIds = [...new Set(prefs.rows.map((r) => r.user_id).filter(Boolean))];

  /**
   * The catalog holds duplicates ("Fiqh" exists under two ids) and two separate
   * taxonomies: ~57 fine-grained learning topics plus the 12 program chips from
   * onboarding. Collapse by name so a category is listed once, and remap the
   * duplicate ids onto the surviving one so a member who picked both is still
   * counted once.
   */
  const canonicalByName = new Map<string, InterestCategory>();
  const canonicalId = new Map<number, number>();
  for (const c of [...categories.rows].sort((a, b) => a.id - b.id)) {
    const name = c.category_name?.trim();
    if (!name) continue;
    const nameKey = name.toLowerCase();
    const existing = canonicalByName.get(nameKey);
    if (existing) {
      canonicalId.set(c.id, existing.id);
      continue;
    }
    canonicalByName.set(nameKey, { id: c.id, key: c.category_key, name });
    canonicalId.set(c.id, c.id);
  }

  // Interest picks, scoped to the same member set the rest of the page counts.
  // Chunked because `.in()` on a few thousand ids makes an unreasonable URL.
  const interestCounts = new Map<number, number>();
  const seenPick = new Set<string>();
  for (let i = 0; i < memberIds.length; i += 200) {
    const chunk = memberIds.slice(i, i + 200);
    const picks = await fetchAll<{ user_id: string; interest_id: number }>(() =>
      supabase
        .from("user_islamic_interests")
        .select("user_id, interest_id")
        .eq("mosque_id", mosqueId)
        .in("user_id", chunk)
        .order("user_id", { ascending: true })
    );
    if (picks.error) return NextResponse.json({ error: picks.error }, { status: 500 });
    for (const p of picks.rows) {
      const id = canonicalId.get(p.interest_id);
      if (id == null) continue; // pick references a category that no longer exists
      // One member counts once per interest, even across merged duplicates.
      const key = `${p.user_id}:${id}`;
      if (seenPick.has(key)) continue;
      seenPick.add(key);
      interestCounts.set(id, (interestCounts.get(id) ?? 0) + 1);
    }
  }

  const members: EnrichedMember[] = prefs.rows.map((r) => ({
    gender: normalizeGender(r.gender),
    birthYear: r.birth_year ?? null,
    isRevert: r.is_revert ?? null,
    hasChildren: r.has_children ?? null,
    childrenAges: r.children_ages ?? [],
    preferredDays: r.preferred_days ?? [],
    preferredTimes: r.preferred_times ?? [],
    // One row can carry several, comma-separated ("student,single_working").
    lifeStages: (r.life_stage ?? "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean),
    createdAtMs: r.profiles?.created_at ? new Date(r.profiles.created_at).getTime() : null,
  }));

  /**
   * Engagement per item. `saved_content` is the current state (who has it saved
   * right now); the unsave rows are history. Counting DISTINCT PEOPLE who
   * unsaved and are no longer saved — rather than unsave events — is the whole
   * point: on real rows one member toggling save/unsave six times inflates the
   * event count ~6x and would paint a healthy program as failing.
   */
  const savedPairs = new Set(saves.rows.map((r) => `${r.content_id}:${r.user_id}`));
  const savedCount = new Map<string, number>();
  for (const r of saves.rows) {
    savedCount.set(r.content_id, (savedCount.get(r.content_id) ?? 0) + 1);
  }

  const walkedAway = new Map<string, Set<string>>();
  for (const r of unsaves.rows) {
    if (savedPairs.has(`${r.content_id}:${r.user_id}`)) continue; // saved again since
    const set = walkedAway.get(r.content_id) ?? new Set<string>();
    set.add(r.user_id);
    walkedAway.set(r.content_id, set);
  }

  const reminderCount = new Map<string, number>();
  for (const r of reminders.rows) {
    reminderCount.set(r.content_id, (reminderCount.get(r.content_id) ?? 0) + 1);
  }

  const contentSummaries: ContentSummary[] = content.rows.map((c) => ({
    contentId: c.content_id,
    name: c.name ?? "Untitled",
    type: c.type,
    isKids: c.is_kids ?? false,
    isFourteenPlus: c.is_fourteen_plus ?? false,
    gender: c.gender,
    days: c.days ?? [],
    interestIds: (c.content_islamic_interests ?? []).map(
      (t) => canonicalId.get(t.interest_id) ?? t.interest_id
    ),
    saved: savedCount.get(c.content_id) ?? 0,
    dropped: walkedAway.get(c.content_id)?.size ?? 0,
    reminders: reminderCount.get(c.content_id) ?? 0,
  }));

  const interestCategories: InterestCategory[] = [...canonicalByName.values()];

  return NextResponse.json(
    buildInsights({
      members,
      content: contentSummaries,
      categories: interestCategories,
      interestCounts,
      nowMs: Date.now(),
      currentYear: new Date().getFullYear(),
    })
  );
}
