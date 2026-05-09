export type Member = {
  id: string;
  name: string;
  email: string;
  /** ISO 8601 */
  signupAt: string;
  /** ISO 8601 */
  lastActiveAt: string | null;
  rsvpCount: number;
  hasPushToken: boolean;
  /** "user" / "guest" — viewer-only, not an admin role */
  membershipKind: "regular" | "new" | "regular";
};

const FIRST_NAMES = [
  "Ahmad", "Aisha", "Omar", "Fatima", "Yusuf", "Khadija", "Bilal", "Maryam",
  "Hassan", "Hafsa", "Ibrahim", "Zainab", "Idris", "Asma", "Hamza", "Sumayyah",
  "Khalid", "Amina", "Mustafa", "Layla", "Yahya", "Rahima", "Tariq", "Saara",
  "Imran", "Nusaybah", "Salman", "Ruqayya", "Adam", "Safiya", "Junaid", "Nafisa",
  "Faisal", "Halima", "Luqman", "Iman", "Mansoor", "Bushra", "Nabil", "Yumna",
  "Rashid", "Sadia", "Tahir", "Zahra", "Walid", "Hibba", "Zayd", "Madiha",
  "Hisham", "Lubna",
];

const LAST_NAMES = [
  "Khan", "Ali", "Hassan", "Hussein", "Rahman", "Mohammed", "Aziz", "Siddiqui",
  "Sheikh", "Malik", "Qureshi", "Ansari", "Saeed", "Choudhury", "Hamid", "Bashir",
  "Hamoudeh", "Yusuf", "Awan", "Iqbal", "Patel", "Akhtar", "Riaz", "Mahmood",
  "Faruqui", "Hashmi",
];

const DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "icloud.com", "hotmail.com"];

function rng(seed: number) {
  // Mulberry32 — deterministic seedable PRNG so the fixtures don't shift on
  // every dev reload (which would defeat sorting demos).
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOW = new Date("2026-05-08T12:00:00Z").getTime();
const DAY = 86_400_000;

function build(): Member[] {
  const rand = rng(1799);
  const out: Member[] = [];
  for (let i = 0; i < 50; i++) {
    const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
    const last = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
    const domain = DOMAINS[Math.floor(rand() * DOMAINS.length)];
    const signupOffsetDays = Math.floor(rand() * 240); // up to ~8 months ago
    const signupAt = new Date(NOW - signupOffsetDays * DAY).toISOString();
    // Last active: between signup and now, weighted towards recent
    const recencyBias = rand() * rand();
    const activeOffsetDays = Math.floor(recencyBias * signupOffsetDays);
    const lastActiveAt = rand() > 0.05
      ? new Date(NOW - activeOffsetDays * DAY).toISOString()
      : null;
    const rsvpCount = Math.floor(rand() * 18);
    const hasPushToken = rand() > 0.32;
    const isNew = signupOffsetDays < 14;
    out.push({
      id: `mem_${i.toString().padStart(3, "0")}`,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@${domain}`,
      signupAt,
      lastActiveAt,
      rsvpCount,
      hasPushToken,
      membershipKind: isNew ? "new" : "regular",
    });
  }
  return out;
}

export const seedMembers: Member[] = build();
