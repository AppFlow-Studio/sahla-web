/**
 * Shared, server-free types + the pure aggregation used by the member-insights
 * feature. Kept out of `route.ts` so client modules (the hook, the seed) can
 * import these without dragging server-only code (admin Supabase, Clerk) into
 * the client bundle.
 *
 * `aggregateInsights` is the single source of truth for how raw members roll up
 * into the dashboard — the server route runs it over DB rows, the HQ preview
 * runs it over the seed, so a chip behaves identically in both.
 */

export type GenderSlice = { label: "Male" | "Female" | "Other"; count: number };
export type AgeBand = { band: string; count: number };
export type PopularItem = {
  name: string;
  /** Raw content_items.type ("program" | "event"). */
  type: string;
  saves: number;
};

export type MemberInsights = {
  segment: SegmentKey;
  totalMembers: number;
  /** Joined this calendar month (month-to-date). */
  newThisMonth: number;
  /** Members with an active push token. */
  pushEnabled: number;
  /** Members with both gender AND birth_year set — the demographic ceiling. */
  profileComplete: number;
  /** Gender breakdown; cohorts under 5 are suppressed. */
  gender: GenderSlice[];
  /** Age bands in order; cohorts under 5 are suppressed. */
  ageBands: AgeBand[];
  reverts: number;
  /** Members who answered the revert question (denominator for revert %). */
  answeredRevert: number;
  families: number;
  /** Members who answered the children question (denominator for families %). */
  answeredKids: number;
  programOn: number;
  eventOn: number;
  prayerOn: number;
  /** Members without program notifications on — the re-engagement gap. */
  programMissing: number;
  popular: PopularItem[];
};

/** One normalized member, the unit `aggregateInsights` rolls up. No PII. */
export type EnrichedMember = {
  gender: "male" | "female" | "other" | null;
  birthYear: number | null;
  /** null = question not answered. */
  isRevert: boolean | null;
  /** null = question not answered. */
  hasChildren: boolean | null;
  pushEnabled: boolean;
  programOn: boolean;
  eventOn: boolean;
  prayerOn: boolean;
  /** profiles.created_at as epoch ms, or null. */
  createdAtMs: number | null;
};

export type SegmentKey = "all" | "new" | "profile" | "push" | "families";

export const SEGMENTS: { key: SegmentKey; label: string }[] = [
  { key: "all", label: "All members" },
  { key: "new", label: "New Muslims" },
  { key: "profile", label: "Profile completed" },
  { key: "push", label: "Push enabled" },
  { key: "families", label: "Families" },
];

const SEGMENT_PREDICATE: Record<SegmentKey, (m: EnrichedMember) => boolean> = {
  all: () => true,
  new: (m) => m.isRevert === true,
  profile: (m) => m.gender != null && m.birthYear != null,
  push: (m) => m.pushEnabled,
  families: (m) => m.hasChildren === true,
};

export function parseSegment(raw: string | null | undefined): SegmentKey {
  return SEGMENTS.some((s) => s.key === raw) ? (raw as SegmentKey) : "all";
}

/** Cohorts smaller than this are suppressed so individuals stay un-identifiable. */
const MIN_COHORT = 5;
const AGE_BAND_ORDER = ["13-17", "18-24", "25-34", "35-49", "50-64", "65+"];

function genderLabel(g: NonNullable<EnrichedMember["gender"]>): GenderSlice["label"] {
  if (g === "male") return "Male";
  if (g === "female") return "Female";
  return "Other";
}

function ageBand(age: number): string {
  if (age < 18) return "13-17";
  if (age <= 24) return "18-24";
  if (age <= 34) return "25-34";
  if (age <= 49) return "35-49";
  if (age <= 64) return "50-64";
  return "65+";
}

export function emptyInsights(segment: SegmentKey = "all"): MemberInsights {
  return {
    segment,
    totalMembers: 0,
    newThisMonth: 0,
    pushEnabled: 0,
    profileComplete: 0,
    gender: [],
    ageBands: [],
    reverts: 0,
    answeredRevert: 0,
    families: 0,
    answeredKids: 0,
    programOn: 0,
    eventOn: 0,
    prayerOn: 0,
    programMissing: 0,
    popular: [],
  };
}

export const EMPTY_INSIGHTS: MemberInsights = emptyInsights("all");

/**
 * Roll a member set up into the dashboard payload, scoped to `segment`.
 * `popular` is mosque-wide (not segment-scoped). `nowMs`/`currentYear` are
 * passed in so this stays pure (no clock reads) and safe to call in render.
 */
export function aggregateInsights(
  members: EnrichedMember[],
  segment: SegmentKey,
  popular: PopularItem[],
  nowMs: number,
  currentYear: number
): MemberInsights {
  const scoped = members.filter(SEGMENT_PREDICATE[segment]);
  const total = scoped.length;

  const monthStart = (() => {
    const d = new Date(nowMs);
    return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  })();

  let newThisMonth = 0;
  let pushEnabled = 0;
  let profileComplete = 0;
  let programOn = 0;
  let eventOn = 0;
  let prayerOn = 0;
  let reverts = 0;
  let answeredRevert = 0;
  let families = 0;
  let answeredKids = 0;
  const genderTally = new Map<GenderSlice["label"], number>();
  const ageTally = new Map<string, number>();

  for (const m of scoped) {
    if (m.createdAtMs != null && m.createdAtMs >= monthStart) newThisMonth += 1;
    if (m.pushEnabled) pushEnabled += 1;
    if (m.gender != null && m.birthYear != null) profileComplete += 1;
    if (m.programOn) programOn += 1;
    if (m.eventOn) eventOn += 1;
    if (m.prayerOn) prayerOn += 1;

    if (m.gender != null) {
      const label = genderLabel(m.gender);
      genderTally.set(label, (genderTally.get(label) ?? 0) + 1);
    }
    if (m.birthYear != null) {
      const age = currentYear - m.birthYear;
      if (age > 0 && age < 120) {
        const band = ageBand(age);
        ageTally.set(band, (ageTally.get(band) ?? 0) + 1);
      }
    }
    if (m.isRevert != null) {
      answeredRevert += 1;
      if (m.isRevert) reverts += 1;
    }
    if (m.hasChildren != null) {
      answeredKids += 1;
      if (m.hasChildren) families += 1;
    }
  }

  // <5 cohort suppression.
  const gender: GenderSlice[] = (["Male", "Female", "Other"] as const)
    .map((label) => ({ label, count: genderTally.get(label) ?? 0 }))
    .filter((s) => s.count >= MIN_COHORT);

  const ageBands: AgeBand[] = AGE_BAND_ORDER.map((band) => ({
    band,
    count: ageTally.get(band) ?? 0,
  })).filter((b) => b.count >= MIN_COHORT);

  return {
    segment,
    totalMembers: total,
    newThisMonth,
    pushEnabled,
    profileComplete,
    gender,
    ageBands,
    reverts,
    answeredRevert,
    families,
    answeredKids,
    programOn,
    eventOn,
    prayerOn,
    programMissing: total - programOn,
    popular,
  };
}
