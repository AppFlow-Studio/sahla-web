import type {
  EnrichedMember,
  PopularItem,
} from "@/app/api/crm/members/insights/shared";

/**
 * Illustrative per-member fixture for HQ previews. Deterministic so the charts
 * don't reshuffle on reload. Distribution mirrors the reviewed mockup (≈520
 * members, 57/43 gender, ~64% reachable, ~71% profile-complete) and — because
 * it's per-member — the segment chips actually re-scope it in the HQ preview.
 */
function rng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOW = new Date("2026-06-18T12:00:00Z").getTime();
const DAY = 86_400_000;
const CURRENT_YEAR = 2026;

// Age-bucket weights → [minAge, maxAge], matching the 6/19/31/27/12/5 shape.
const AGE_BUCKETS: { weight: number; min: number; max: number }[] = [
  { weight: 0.06, min: 13, max: 17 },
  { weight: 0.19, min: 18, max: 24 },
  { weight: 0.31, min: 25, max: 34 },
  { weight: 0.27, min: 35, max: 49 },
  { weight: 0.12, min: 50, max: 64 },
  { weight: 0.05, min: 65, max: 78 },
];

function pickAge(rand: () => number): number {
  const roll = rand();
  let acc = 0;
  for (const b of AGE_BUCKETS) {
    acc += b.weight;
    if (roll <= acc) return b.min + Math.floor(rand() * (b.max - b.min + 1));
  }
  return 30;
}

function build(): EnrichedMember[] {
  const rand = rng(5201);
  const out: EnrichedMember[] = [];
  for (let i = 0; i < 520; i++) {
    // ~92% completed personalization (gender + age); the rest leave it blank.
    const completed = rand() < 0.92;
    const gender: EnrichedMember["gender"] = completed
      ? rand() < 0.57
        ? "male"
        : "female"
      : null;
    const birthYear = completed ? CURRENT_YEAR - pickAge(rand) : null;
    const signupOffsetDays = Math.floor(rand() * 300);
    out.push({
      gender,
      birthYear,
      isRevert: completed ? rand() < 0.14 : null,
      hasChildren: completed ? rand() < 0.31 : null,
      pushEnabled: rand() < 0.64,
      programOn: rand() < 0.38,
      eventOn: rand() < 0.31,
      prayerOn: rand() < 0.71,
      createdAtMs: NOW - signupOffsetDays * DAY,
    });
  }
  return out;
}

export const seedEnrichedMembers: EnrichedMember[] = build();

export const seedPopular: PopularItem[] = [
  { name: "Friday Halaqa", type: "program", saves: 142 },
  { name: "Quran Intensive", type: "program", saves: 118 },
  { name: "Eid Festival", type: "event", saves: 96 },
  { name: "Youth Night", type: "program", saves: 73 },
  { name: "Community Iftar", type: "event", saves: 64 },
];
