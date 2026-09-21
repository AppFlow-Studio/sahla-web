/**
 * Server-free types + the pure aggregation behind the CRM Insights page.
 *
 * Lives outside `route.ts` on purpose: client modules (the hook, the page) import
 * these types and the `EMPTY_INSIGHTS` value, and importing anything from a route
 * file drags Clerk's `server-only` into the browser bundle. Same rule the member
 * insights feature follows — see `app/api/crm/members/insights/shared.ts`.
 *
 * `buildInsights` is deliberately pure (no clock reads, no I/O) so the route can
 * run it over DB rows and tests can run it over fixtures with identical results.
 */

/* ----------------------------------- types ---------------------------------- */

export type GenderSlice = { label: "Male" | "Female" | "Other"; count: number };
export type Bucket = { label: string; count: number };

/** One interest category, with the demand for it and what the mosque already runs. */
export type InterestDemand = {
  key: string;
  name: string;
  /** Members who picked this interest. */
  members: number;
  /** Programs + events that already serve it (tagged, flagged, or name-matched). */
  offerings: number;
};

/** How one program or event is landing with the community. */
export type ContentPerformance = {
  id: string;
  name: string;
  /** Raw content_items.type — "program" | "event". */
  type: string;
  /** Members who currently have it saved. */
  saved: number;
  /**
   * Distinct members who saved it and later removed it — counted as PEOPLE, not
   * unsave events. Someone toggling save/unsave six times is one person who
   * walked away, and on real rows the event count overstates by ~6x.
   */
  dropped: number;
  /** Members who turned on reminders for it. */
  reminders: number;
  /** More people walked away than stayed — worth a second look. */
  losingInterest: boolean;
};

/**
 * One thing the mosque should consider putting on the calendar.
 *
 * Split into three short lines rather than one sentence: the page is read by
 * older adults and by people whose first language isn't English, so each line
 * carries a single idea — what it is, who wants it, what's missing.
 */
export type Suggestion = {
  id: string;
  /** The topic or audience. A name, not a sentence. */
  title: string;
  /** Who wants it. One short line with a plain count. */
  demand: string;
  /** What is missing right now. One short line. */
  gap: string;
  /** Drives the CTA target — programs list vs events list. */
  kind: "program" | "event";
  /** Sort key only; never rendered as a number. */
  score: number;
};

export type CommunityInsights = {
  totalMembers: number;
  newThisMonth: number;
  /** Members with both gender AND birth year — the demographic ceiling. */
  profileComplete: number;
  programCount: number;
  eventCount: number;

  gender: GenderSlice[];
  ageBands: Bucket[];
  /** Ages of members' children, bucketed. Suppressed under the cohort floor. */
  childAges: Bucket[];
  families: number;
  answeredKids: number;
  reverts: number;
  answeredRevert: number;

  /** Top interests by demand, capped so the page stays scannable. */
  interests: InterestDemand[];
  /** How many interests cleared the cohort floor, before the display cap. */
  interestsTotal: number;
  /** True when nothing in the app has interest data yet — drives the empty state. */
  interestsUnanswered: boolean;

  /** Best-performing programs and events. Only items with some engagement. */
  performance: ContentPerformance[];
  /** Programs + events with no saves and no reminders at all. */
  quietCount: number;
  /** Total programs + events, the denominator for `quietCount`. */
  contentTotal: number;
  /** True when nobody has saved anything yet — drives the empty state. */
  engagementUnanswered: boolean;

  /** Life stages members are in. Multi-valued; suppressed under the floor. */
  lifeStages: Bucket[];

  preferredDays: Bucket[];
  preferredTimes: Bucket[];

  suggestions: Suggestion[];
};

/** One normalized member. No PII — this is the unit `buildInsights` rolls up. */
export type EnrichedMember = {
  gender: "male" | "female" | "other" | null;
  birthYear: number | null;
  isRevert: boolean | null;
  hasChildren: boolean | null;
  childrenAges: number[];
  /** One member can be in several ("student" and "single_working"). */
  lifeStages: string[];
  preferredDays: string[];
  preferredTimes: string[];
  /** profiles.created_at as epoch ms. */
  createdAtMs: number | null;
};

/** One piece of content the mosque already runs, reduced to what coverage needs. */
export type ContentSummary = {
  contentId: string;
  name: string;
  /** Raw content_items.type. */
  type: string;
  isKids: boolean;
  isFourteenPlus: boolean;
  /** content_items.gender — "All" by default. */
  gender: string | null;
  days: string[];
  /** islamic_interest_categories.id values tagged on this item. */
  interestIds: number[];
  /** Members who currently have it saved. */
  saved: number;
  /** Distinct members who saved then removed it. */
  dropped: number;
  /** Members who turned on reminders for it. */
  reminders: number;
};

export type InterestCategory = { id: number; key: string; name: string };

/* --------------------------------- constants -------------------------------- */

/** Cohorts smaller than this are suppressed so individuals stay un-identifiable. */
export const MIN_COHORT = 5;

const AGE_BAND_ORDER = ["13-17", "18-24", "25-34", "35-49", "50-64", "65+"] as const;
const CHILD_BAND_ORDER = ["Under 5", "5-9", "10-12", "13-17"] as const;

export const AGE_BANDS: readonly string[] = AGE_BAND_ORDER;

export const EMPTY_INSIGHTS: CommunityInsights = {
  totalMembers: 0,
  newThisMonth: 0,
  profileComplete: 0,
  programCount: 0,
  eventCount: 0,
  gender: [],
  ageBands: [],
  childAges: [],
  families: 0,
  answeredKids: 0,
  reverts: 0,
  answeredRevert: 0,
  interests: [],
  interestsTotal: 0,
  interestsUnanswered: true,
  performance: [],
  quietCount: 0,
  contentTotal: 0,
  engagementUnanswered: true,
  lifeStages: [],
  preferredDays: [],
  preferredTimes: [],
  suggestions: [],
};

/* --------------------------------- helpers ---------------------------------- */

function ageBand(age: number): string {
  if (age < 18) return "13-17";
  if (age <= 24) return "18-24";
  if (age <= 34) return "25-34";
  if (age <= 49) return "35-49";
  if (age <= 64) return "50-64";
  return "65+";
}

function childBand(age: number): string | null {
  if (age < 0 || age > 17) return null;
  if (age < 5) return "Under 5";
  if (age <= 9) return "5-9";
  if (age <= 12) return "10-12";
  return "13-17";
}

function share(part: number, whole: number): number {
  return whole > 0 ? part / whole : 0;
}

function plural(n: number, one: string, many = one + "s"): string {
  return n === 1 ? one : many;
}

/**
 * Make a raw preference value readable. Real rows hold a mix of shapes —
 * "Fridays", "friday_evening", "19:00" — so 24h times become "7:00 PM" and
 * everything else is just tidied and title-cased.
 */
export function prettifyPreference(raw: string): string {
  const trimmed = raw.trim();
  const time = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (time) {
    const h = Number(time[1]);
    if (h >= 0 && h <= 23) {
      const suffix = h < 12 ? "AM" : "PM";
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      return `${hour12}:${time[2]} ${suffix}`;
    }
  }
  const cleaned = trimmed.replace(/[_-]+/g, " ").toLowerCase();
  if (!cleaned) return raw;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * `user_preferences.life_stage` holds slugs, sometimes several comma-separated
 * on one row. Spell the known ones out; anything new falls back to the generic
 * tidy-up so a slug added later still reads sensibly instead of breaking.
 */
const LIFE_STAGE_LABELS: Record<string, string> = {
  student: "Student",
  single_working: "Single, working",
  married_no_kids: "Married, no kids",
  parent_young_kids: "Parent, young kids",
  parent_teens: "Parent, teens",
  empty_nester: "Empty nester",
  new_to_islam: "New to Islam",
  senior: "Senior",
  retired: "Retired",
};

export function lifeStageLabel(raw: string): string {
  const key = raw.trim().toLowerCase();
  return LIFE_STAGE_LABELS[key] ?? prettifyPreference(raw);
}

/**
 * Reduce a day to its singular lowercase name so "Fridays", "friday" and the
 * "Friday" stored in `content_items.days` all compare equal.
 */
function dayKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/s$/, "");
}

/** Tally a list of string values into ordered, suppressed buckets. */
function tally(
  values: string[][],
  floor: number,
  label_: (raw: string) => string = prettifyPreference
): Bucket[] {
  const counts = new Map<string, number>();
  for (const list of values) {
    // De-dupe within a member so one person can't double-count a preference.
    for (const raw of new Set(list)) {
      const label = label_(raw);
      if (!label) continue;
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .filter((b) => b.count >= floor)
    .sort((a, b) => b.count - a.count);
}

/* ------------------------------ interest coverage --------------------------- */

/**
 * How we decide a mosque already serves an interest.
 *
 * Tagging (`content_islamic_interests`) is the designed path, but nothing in the
 * CRM writes those rows today — only the recommender reads them. So coverage also
 * accepts the structural flags on `content_items` and a keyword match on the
 * item's name. Without the fallback every category would read as "you run nothing
 * for this" and the suggestions below would be noise instead of signal.
 */
const COVERAGE: Record<string, { keywords: string[]; flag?: (c: ContentSummary) => boolean }> = {
  daily_prayers: { keywords: ["prayer", "salah", "salat", "qiyam", "tahajjud", "taraweeh"] },
  jummah_khutbah: { keywords: ["jummah", "jumuah", "jumu'ah", "khutbah", "friday"] },
  quran_study_tafseer: {
    keywords: ["quran", "qur'an", "tafseer", "tafsir", "tajweed", "hifz", "memoriz", "recitation"],
  },
  halaqas_study_circles: {
    keywords: ["halaqa", "halaqah", "circle", "study", "class", "seminar", "dars", "lecture"],
  },
  kids_programs: {
    keywords: ["kid", "child", "madrasah", "madrasa", "sunday school", "junior"],
    flag: (c) => c.isKids,
  },
  youth_programs: {
    keywords: ["youth", "teen", "msa", "young adult"],
    flag: (c) => c.isFourteenPlus,
  },
  community_events: {
    keywords: ["community", "potluck", "picnic", "bbq", "barbecue", "dinner", "iftar", "eid", "fundraiser", "open house"],
  },
  sisters_programs: {
    keywords: ["sister", "women", "ladies"],
    flag: (c) => {
      const g = (c.gender ?? "").trim().toLowerCase();
      return g === "female" || g === "sisters" || g === "women";
    },
  },
  volunteering_service: {
    keywords: ["volunteer", "service", "cleanup", "clean up", "food drive", "charity", "soup kitchen"],
  },
  new_muslim_support: { keywords: ["new muslim", "revert", "convert", "shahada"] },
  marriage_family: { keywords: ["marriage", "nikah", "family", "parenting", "spouse", "couples"] },
  seniors_community: { keywords: ["senior", "elder", "55+", "60+"] },
};

/**
 * Words too generic to prove a topic is covered. "Fiqh of Salah" shouldn't count
 * as coverage for every category with "islam" in its name.
 */
const STOPWORDS = new Set([
  "the", "and", "for", "with", "in", "of", "to", "a", "an",
  "islam", "islamic", "muslim", "muslims", "allah", "prophet",
]);

/**
 * Distinctive words from a category name, used when the category has no entry in
 * COVERAGE. The seeded catalog holds ~57 fine-grained topics (Seerah, Tafsir,
 * Marriage in Islam, …) on top of the 12 program chips, and hand-writing keyword
 * rules for all of them would rot the moment someone adds a category.
 */
function nameTokens(name: string): string[] {
  return name
    .toLowerCase()
    .split(/[^a-z']+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

/** Whole-word match — keeps "men" out of "women". */
function hasWord(haystack: string, word: string): boolean {
  return new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(haystack);
}

function servesInterest(item: ContentSummary, cat: InterestCategory): boolean {
  if (item.interestIds.includes(cat.id)) return true;

  const haystack = item.name.toLowerCase();
  const rule = COVERAGE[cat.key];
  if (rule) {
    if (rule.flag?.(item)) return true;
    // Substrings on purpose here: "kid" should catch "kids", "memoriz" should
    // catch "memorization".
    return rule.keywords.some((k) => haystack.includes(k));
  }

  const tokens = nameTokens(cat.name);
  return tokens.length > 0 && tokens.some((t) => hasWord(haystack, t));
}

/* --------------------------------- suggestions ------------------------------- */

/** Interests that read more naturally as a one-off event than a recurring program. */
const EVENT_SHAPED = new Set(["community_events", "volunteering_service"]);

/** Most suggestions one rule family may contribute, so the list stays varied. */
const MAX_PER_FAMILY = 3;

/**
 * How many interests the page lists. The catalog runs to ~68 categories, so a
 * large mosque could clear the cohort floor on most of them — a wall of bars
 * nobody reads. Suggestions are computed from the full list first, so capping
 * the display never hides a gap.
 */
const MAX_INTERESTS_SHOWN = 12;

/** How many programs/events the "what's landing" list ranks. */
const MAX_PERFORMANCE_SHOWN = 6;

const WEEKDAYS = new Set([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

type SuggestionContext = {
  totalMembers: number;
  interests: InterestDemand[];
  offeringsByKey: Map<string, number>;
  genderCounts: Map<GenderSlice["label"], number>;
  genderAnswered: number;
  ageCounts: Map<string, number>;
  ageAnswered: number;
  families: number;
  answeredKids: number;
  childAges: Bucket[];
  reverts: number;
  answeredRevert: number;
  preferredDays: Bucket[];
  contentCount: number;
  dayCoverage: Map<string, number>;
};

function buildSuggestions(ctx: SuggestionContext): Suggestion[] {
  const out: Suggestion[] = [];
  const offered = (key: string) => ctx.offeringsByKey.get(key) ?? 0;

  // 1. Real demand for an interest, nothing on the calendar serving it — the
  //    clearest kind of gap. Capped: the catalog carries ~57 learning topics, and
  //    without a cap their long tail would fill every slot and push the
  //    demographic gaps below off the page.
  const gaps: Suggestion[] = [];
  for (const i of ctx.interests) {
    if (i.members < MIN_COHORT || i.offerings > 0) continue;
    const isEvent = EVENT_SHAPED.has(i.key);
    gaps.push({
      id: `gap-${i.key}`,
      kind: isEvent ? "event" : "program",
      title: i.name,
      demand: `${i.members} ${plural(i.members, "person", "people")} interested`,
      gap: isEvent ? "No event scheduled" : "No class scheduled",
      score: 70 + Math.round(share(i.members, ctx.totalMembers) * 25),
    });
  }
  out.push(...gaps.sort((a, b) => b.score - a.score).slice(0, MAX_PER_FAMILY));

  // 2. Served, but thinly — a lot of interested members against one offering.
  const thin: Suggestion[] = [];
  for (const i of ctx.interests) {
    if (i.offerings === 0) continue; // rule 1 already speaks for these
    if (i.members < MIN_COHORT * 4) continue;
    if (i.members / i.offerings < 25) continue;
    const isEvent = EVENT_SHAPED.has(i.key);
    thin.push({
      id: `thin-${i.key}`,
      kind: isEvent ? "event" : "program",
      title: i.name,
      demand: `${i.members} ${plural(i.members, "person", "people")} interested`,
      gap: `Only ${i.offerings} ${plural(i.offerings, isEvent ? "event" : "class", isEvent ? "events" : "classes")} scheduled`,
      score: 45 + Math.round(share(i.members, ctx.totalMembers) * 20),
    });
  }
  out.push(...thin.sort((a, b) => b.score - a.score).slice(0, 2));

  // 3. Families with kids at home and nothing marked for kids.
  if (ctx.answeredKids >= MIN_COHORT && offered("kids_programs") === 0) {
    const familyShare = share(ctx.families, ctx.answeredKids);
    if (familyShare >= 0.3 && ctx.families >= MIN_COHORT) {
      const youngest = ctx.childAges[0]?.label;
      out.push({
        id: "demo-kids",
        kind: "program",
        title: "Kids Program",
        // A count, not a percentage: "8 of 10" needs no maths to understand.
        demand: `${ctx.families} of ${ctx.answeredKids} people have children`,
        gap: youngest
          ? `No kids program scheduled. Most children are ${youngest.toLowerCase()}.`
          : "No kids program scheduled",
        score: 78,
      });
    }
  }

  // 4. A young membership with nothing aimed at them.
  const youth = (ctx.ageCounts.get("13-17") ?? 0) + (ctx.ageCounts.get("18-24") ?? 0);
  if (youth >= MIN_COHORT && share(youth, ctx.ageAnswered) >= 0.2 && offered("youth_programs") === 0) {
    out.push({
      id: "demo-youth",
      kind: "program",
      title: "Youth Program",
      demand: `${youth} ${plural(youth, "person", "people")} are under 25`,
      gap: "No youth program scheduled",
      score: 74,
    });
  }

  // 5. Sisters make up a large share and every program is mixed.
  const female = ctx.genderCounts.get("Female") ?? 0;
  if (female >= MIN_COHORT && share(female, ctx.genderAnswered) >= 0.35 && offered("sisters_programs") === 0) {
    out.push({
      id: "demo-sisters",
      kind: "program",
      title: "Sisters-Only Program",
      demand: `${female} of ${ctx.genderAnswered} members are sisters`,
      gap: "No sisters-only program scheduled",
      score: 66,
    });
  }

  // 6. New Muslims with no dedicated support.
  if (ctx.reverts >= MIN_COHORT && offered("new_muslim_support") === 0) {
    out.push({
      id: "demo-reverts",
      kind: "program",
      title: "New Muslim Class",
      demand: `${ctx.reverts} ${plural(ctx.reverts, "person", "people")} are new to Islam`,
      gap: "No class for new Muslims",
      score: 72,
    });
  }

  // 7. Seniors present, nothing for them.
  const seniors = ctx.ageCounts.get("65+") ?? 0;
  if (seniors >= MIN_COHORT && offered("seniors_community") === 0) {
    out.push({
      id: "demo-seniors",
      kind: "event",
      title: "Program for Seniors",
      demand: `${seniors} members are 65 or older`,
      gap: "Nothing scheduled for seniors",
      score: 52,
    });
  }

  // 8. Everyone is free on a day the mosque barely uses. Only fires for real
  //    weekday names — a preference like "Weekends" can't be checked against
  //    `content_items.days`, so claiming coverage for it would be a guess.
  const topDay = ctx.preferredDays.find((d) => WEEKDAYS.has(dayKey(d.label)));
  if (topDay && ctx.contentCount >= 3 && share(topDay.count, ctx.totalMembers) >= 0.35) {
    const key = dayKey(topDay.label);
    const onThatDay = ctx.dayCoverage.get(key) ?? 0;
    // Members answer with plurals ("Fridays"); the copy reads as a single day.
    const day = key.charAt(0).toUpperCase() + key.slice(1);
    if (share(onThatDay, ctx.contentCount) < 0.25) {
      out.push({
        id: "timing-day",
        kind: "program",
        title: `${day} Program`,
        demand: `${topDay.count} people prefer ${day}`,
        gap:
          onThatDay === 0
            ? `Nothing is scheduled on ${day}`
            : `Only ${onThatDay} of ${ctx.contentCount} run on ${day}`,
        score: 48,
      });
    }
  }

  return out.sort((a, b) => b.score - a.score).slice(0, 5);
}

/* -------------------------------- aggregation -------------------------------- */

export type BuildInput = {
  members: EnrichedMember[];
  content: ContentSummary[];
  categories: InterestCategory[];
  /** interest_id → how many members picked it, already scoped to this mosque. */
  interestCounts: Map<number, number>;
  /** Passed in so this stays pure and safe to call during render. */
  nowMs: number;
  currentYear: number;
};

/**
 * Roll a mosque's members, calendar, and audit trail into the Insights payload.
 *
 * Every cohort that leaves this function has already been through the <5
 * suppression floor, so privacy holds even if a caller renders the payload raw.
 */
export function buildInsights(input: BuildInput): CommunityInsights {
  const { members, content, categories, interestCounts, nowMs, currentYear } = input;
  const total = members.length;

  const monthStart = (() => {
    const d = new Date(nowMs);
    return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  })();

  let newThisMonth = 0;
  let profileComplete = 0;
  let families = 0;
  let answeredKids = 0;
  let reverts = 0;
  let answeredRevert = 0;
  const genderCounts = new Map<GenderSlice["label"], number>();
  const ageCounts = new Map<string, number>();
  const childCounts = new Map<string, number>();

  for (const m of members) {
    if (m.createdAtMs != null && m.createdAtMs >= monthStart) newThisMonth += 1;
    if (m.gender != null && m.birthYear != null) profileComplete += 1;

    if (m.gender != null) {
      const label: GenderSlice["label"] =
        m.gender === "male" ? "Male" : m.gender === "female" ? "Female" : "Other";
      genderCounts.set(label, (genderCounts.get(label) ?? 0) + 1);
    }
    if (m.birthYear != null) {
      const age = currentYear - m.birthYear;
      if (age > 0 && age < 120) {
        const band = ageBand(age);
        ageCounts.set(band, (ageCounts.get(band) ?? 0) + 1);
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
    for (const age of m.childrenAges) {
      const band = childBand(age);
      if (band) childCounts.set(band, (childCounts.get(band) ?? 0) + 1);
    }
  }

  const gender: GenderSlice[] = (["Male", "Female", "Other"] as const)
    .map((label) => ({ label, count: genderCounts.get(label) ?? 0 }))
    .filter((s) => s.count >= MIN_COHORT);

  const ageBands: Bucket[] = AGE_BAND_ORDER.map((label) => ({
    label,
    count: ageCounts.get(label) ?? 0,
  })).filter((b) => b.count >= MIN_COHORT);

  const childAges: Bucket[] = CHILD_BAND_ORDER.map((label) => ({
    label,
    count: childCounts.get(label) ?? 0,
  })).filter((b) => b.count >= MIN_COHORT);

  const genderAnswered = [...genderCounts.values()].reduce((a, b) => a + b, 0);
  const ageAnswered = [...ageCounts.values()].reduce((a, b) => a + b, 0);

  const preferredDays = tally(members.map((m) => m.preferredDays), MIN_COHORT);
  const preferredTimes = tally(members.map((m) => m.preferredTimes), MIN_COHORT);
  const lifeStages = tally(members.map((m) => m.lifeStages), MIN_COHORT, lifeStageLabel);

  // What the calendar already serves, per interest category.
  const offeringsByKey = new Map<string, number>();
  for (const cat of categories) {
    offeringsByKey.set(cat.key, content.filter((c) => servesInterest(c, cat)).length);
  }

  const totalPicks = [...interestCounts.values()].reduce((a, b) => a + b, 0);
  const interests: InterestDemand[] = categories
    .map((cat) => ({
      key: cat.key,
      name: cat.name,
      members: interestCounts.get(cat.id) ?? 0,
      offerings: offeringsByKey.get(cat.key) ?? 0,
    }))
    .filter((i) => i.members >= MIN_COHORT)
    .sort((a, b) => b.members - a.members);

  const dayCoverage = new Map<string, number>();
  for (const c of content) {
    for (const d of new Set(c.days.map(dayKey))) {
      if (d) dayCoverage.set(d, (dayCoverage.get(d) ?? 0) + 1);
    }
  }

  const programCount = content.filter((c) => c.type.toLowerCase() === "program").length;
  const eventCount = content.filter((c) => c.type.toLowerCase() === "event").length;

  /**
   * How what's already on the calendar is landing. Items nobody has touched are
   * left out of the ranking and reported as a single count instead — a list of
   * zeroes teaches nothing, but "5 of your 12 got no response" does.
   */
  const engaged = content.filter((c) => c.saved + c.dropped + c.reminders > 0);
  const performance: ContentPerformance[] = engaged
    .map((c) => ({
      id: c.contentId,
      name: c.name,
      type: c.type,
      saved: c.saved,
      dropped: c.dropped,
      reminders: c.reminders,
      // Deliberately conservative: a single person backing out of a new program
      // is normal, so it takes at least two, and more leavers than stayers.
      losingInterest: c.dropped >= 2 && c.dropped > c.saved,
    }))
    .sort(
      (a, b) =>
        b.saved - a.saved || b.reminders - a.reminders || b.dropped - a.dropped
    )
    .slice(0, MAX_PERFORMANCE_SHOWN);

  const suggestions = buildSuggestions({
    totalMembers: total,
    interests,
    offeringsByKey,
    genderCounts,
    genderAnswered,
    ageCounts,
    ageAnswered,
    families,
    answeredKids,
    childAges,
    reverts,
    answeredRevert,
    preferredDays,
    contentCount: content.length,
    dayCoverage,
  });

  return {
    totalMembers: total,
    newThisMonth,
    profileComplete,
    programCount,
    eventCount,
    gender,
    ageBands,
    childAges,
    families,
    answeredKids,
    reverts,
    answeredRevert,
    interests: interests.slice(0, MAX_INTERESTS_SHOWN),
    interestsTotal: interests.length,
    interestsUnanswered: totalPicks === 0,
    performance,
    quietCount: content.length - engaged.length,
    contentTotal: content.length,
    engagementUnanswered: engaged.length === 0,
    lifeStages,
    preferredDays,
    preferredTimes,
    suggestions,
  };
}
