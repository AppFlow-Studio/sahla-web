export type ContentKind = "program" | "event";

export type ContentItem = {
  id: string;
  kind: ContentKind;
  name: string;
  category: string;
  description: string;
  speakerId?: string;
  speakerName: string;
  imageUrl: string;
  /** ISO 8601 — first occurrence */
  startsAt: string;
  /** Minutes */
  durationMin: number;
  recurrence: "none" | "weekly" | "monthly";
  maxCapacity: number;
  currentCount: number;
  isPaid: boolean;
  /** USD when paid */
  priceUsd?: number;
  isPublished: boolean;
};

export const PROGRAM_CATEGORIES = [
  "Halaqas",
  "Quran Classes",
  "Sisters' Circle",
  "Youth",
  "Tajweed",
] as const;

export const EVENT_CATEGORIES = [
  "Fundraisers",
  "Community",
  "Eid",
  "Lectures",
  "Workshops",
] as const;

const IMAGES = [
  "https://images.unsplash.com/photo-1542816417-0983c9c9ad53",
  "https://images.unsplash.com/photo-1564769662533-4f00a87b4056",
  "https://images.unsplash.com/photo-1514222709107-a180c68d72b4",
  "https://images.unsplash.com/photo-1591622180578-1ad77f8a4c5b",
  "https://images.unsplash.com/photo-1548019979-aaae8b21ad4d",
  "https://images.unsplash.com/photo-1565891741441-64926e441838",
  "https://images.unsplash.com/photo-1564769625905-50e93615e769",
  "https://images.unsplash.com/photo-1518002054494-3a6f94352b9d",
  "https://images.unsplash.com/photo-1545048702-79362596cdc9",
  "https://images.unsplash.com/photo-1601247309111-9d3661f9b265",
];

const NOW = new Date("2026-05-08T12:00:00Z").getTime();
const DAY = 86_400_000;

function rng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const programNames = [
  "Friday Halaqa",
  "Tafsir of Surah Yaseen",
  "Sisters' Quran Circle",
  "Youth Halaqa",
  "Tajweed Intensive",
  "Tuesday Night Hadith",
  "Aqidah Foundations",
  "Fiqh of Worship",
  "Sirah Series",
  "Arabic for Beginners",
  "Wednesday Tafsir",
  "Family Quran Night",
  "New Muslims Circle",
  "Marriage Workshop",
  "Sunday Schools",
  "Quran Memorization",
  "Sisters' Wellness",
  "Monthly Open Mic",
  "Fajr Halaqa",
  "Saturday Iqra",
];

const eventNames = [
  "Eid al-Fitr Prayer",
  "Annual Fundraiser Dinner",
  "Community Iftar",
  "Mosque Open House",
  "Speaker Series: Dr. Yasir Qadhi",
  "Mother's Day Brunch",
  "New Member Welcome",
  "Mental Health Workshop",
  "Hajj Info Session",
  "Quran Recitation Competition",
];

const speakers = [
  { id: "spk_01", name: "Sheikh Omar Suleiman" },
  { id: "spk_02", name: "Imam Yasir Qadhi" },
  { id: "spk_03", name: "Dr. Ingrid Mattson" },
  { id: "spk_04", name: "Sheikh Hamza Yusuf" },
  { id: "spk_05", name: "Ustadha Aisha Rahman" },
  { id: "spk_06", name: "Imam Khalid Latif" },
  { id: "spk_08", name: "Mufti Abdul-Rahman Mangera" },
  { id: "spk_11", name: "Imam Suhaib Webb" },
  { id: "spk_13", name: "Ustadh Nouman Ali Khan" },
  { id: "spk_14", name: "Dr. Yasmin Mogahed" },
];

function build(): ContentItem[] {
  const r = rng(20260508);
  const out: ContentItem[] = [];

  programNames.forEach((name, i) => {
    const speaker = speakers[Math.floor(r() * speakers.length)];
    const cat = PROGRAM_CATEGORIES[Math.floor(r() * PROGRAM_CATEGORIES.length)];
    const startsIn = Math.floor(r() * 60) - 7; // -7 to +52 days
    const recurrenceRoll = r();
    const recurrence: ContentItem["recurrence"] =
      recurrenceRoll > 0.6 ? "weekly" : recurrenceRoll > 0.85 ? "monthly" : "none";
    const maxCap = [25, 40, 60, 80, 120][Math.floor(r() * 5)];
    const fillRate = r() * 0.95;
    const isPaid = r() < 0.18;
    out.push({
      id: `prg_${i.toString().padStart(3, "0")}`,
      kind: "program",
      name,
      category: cat,
      description:
        "Weekly halaqa series. Open to all skill levels — bring a notebook.",
      speakerId: speaker.id,
      speakerName: speaker.name,
      imageUrl: IMAGES[i % IMAGES.length],
      startsAt: new Date(NOW + startsIn * DAY).toISOString(),
      durationMin: [45, 60, 75, 90][Math.floor(r() * 4)],
      recurrence,
      maxCapacity: maxCap,
      currentCount: Math.floor(maxCap * fillRate),
      isPaid,
      priceUsd: isPaid ? [10, 20, 25, 50][Math.floor(r() * 4)] : undefined,
      isPublished: true,
    });
  });

  eventNames.forEach((name, i) => {
    const speaker = speakers[Math.floor(r() * speakers.length)];
    const cat = EVENT_CATEGORIES[Math.floor(r() * EVENT_CATEGORIES.length)];
    const startsIn = Math.floor(r() * 90) + 5; // future-only
    const maxCap = [80, 150, 250, 400][Math.floor(r() * 4)];
    const fillRate = r() * 0.95;
    const isPaid = r() < 0.4;
    out.push({
      id: `evt_${i.toString().padStart(3, "0")}`,
      kind: "event",
      name,
      category: cat,
      description:
        "Annual community gathering. Family-friendly, food provided.",
      speakerId: speaker.id,
      speakerName: speaker.name,
      imageUrl: IMAGES[(i + 3) % IMAGES.length],
      startsAt: new Date(NOW + startsIn * DAY).toISOString(),
      durationMin: 120,
      recurrence: "none",
      maxCapacity: maxCap,
      currentCount: Math.floor(maxCap * fillRate),
      isPaid,
      priceUsd: isPaid ? [25, 50, 75, 100][Math.floor(r() * 4)] : undefined,
      isPublished: true,
    });
  });

  return out;
}

export const seedContent: ContentItem[] = build();

/* ─── RSVP fixtures, generated per content item ─── */

export type ContentRsvp = {
  id: string;
  contentId: string;
  memberName: string;
  memberInitials: string;
  status: "reserved" | "paid" | "attended" | "waitlisted" | "canceled";
  reservedAt: string;
};

const FIRST = ["Ahmad", "Aisha", "Omar", "Fatima", "Yusuf", "Khadija", "Bilal", "Maryam", "Hassan", "Hafsa", "Ibrahim", "Zainab", "Layla", "Hamza"];
const LAST = ["Khan", "Ali", "Hassan", "Hamoudeh", "Patel", "Sheikh", "Rahman", "Iqbal", "Siddiqui"];

export function generateRsvps(item: ContentItem): ContentRsvp[] {
  const r = rng(item.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0));
  const rows: ContentRsvp[] = [];
  for (let i = 0; i < item.currentCount; i++) {
    const first = FIRST[Math.floor(r() * FIRST.length)];
    const last = LAST[Math.floor(r() * LAST.length)];
    const reservedDays = Math.floor(r() * 14);
    const statusRoll = r();
    const status: ContentRsvp["status"] =
      statusRoll < 0.55
        ? "reserved"
        : statusRoll < 0.78
        ? "paid"
        : statusRoll < 0.92
        ? "attended"
        : "canceled";
    rows.push({
      id: `rsvp_${item.id}_${i}`,
      contentId: item.id,
      memberName: `${first} ${last}`,
      memberInitials: `${first[0]}${last[0]}`,
      status,
      reservedAt: new Date(NOW - reservedDays * DAY).toISOString(),
    });
  }
  // Plus a few waitlisted if at capacity
  if (item.currentCount >= item.maxCapacity) {
    for (let i = 0; i < 5; i++) {
      const first = FIRST[Math.floor(r() * FIRST.length)];
      const last = LAST[Math.floor(r() * LAST.length)];
      rows.push({
        id: `rsvp_${item.id}_wl_${i}`,
        contentId: item.id,
        memberName: `${first} ${last}`,
        memberInitials: `${first[0]}${last[0]}`,
        status: "waitlisted",
        reservedAt: new Date(NOW - i * DAY).toISOString(),
      });
    }
  }
  return rows;
}
