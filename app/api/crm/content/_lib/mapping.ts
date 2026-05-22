/**
 * Translation between the CRM's `ContentItem` shape and the
 * `content_items` table. Lives next to the routes so the wire format
 * stays consistent across GET / POST / PATCH.
 */

import type { ContentItem, ContentKind } from "@/app/(crm)/_mock/programs";

export type ContentRow = {
  content_id: string;
  mosque_id: string;
  type: string | null;
  name: string | null;
  description: string | null;
  image: string | null;
  speakers: string[] | null;
  days: string[] | null;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  is_paid: boolean | null;
  price: number | null;
  max_capacity: number | null;
  current_count: number | null;
  is_weekly_program: boolean | null;
};

export const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;
export type Weekday = (typeof WEEKDAYS)[number];

/** Combine a date + time into an ISO string. */
function toIso(date: string | null, time: string | null): string {
  if (!date) return new Date().toISOString();
  const t = time ?? "00:00:00";
  // Treat as local time; the mobile app stores in mosque-local already.
  return new Date(`${date}T${t}`).toISOString();
}

function recurrenceFromDays(days: string[] | null): ContentItem["recurrence"] {
  if (!days || days.length === 0) return "none";
  if (days.length === 7) return "weekly"; // every day
  return "weekly";
}

export function rowToContentItem(row: ContentRow): ContentItem {
  return {
    id: row.content_id,
    kind: (row.type === "event" ? "event" : "program") as ContentKind,
    name: row.name ?? "Untitled",
    category: "", // no category column on content_items — drop in PR 6
    description: row.description ?? "",
    speakerName: row.speakers?.[0] ?? "",
    speakerId: undefined,
    imageUrl: row.image ?? "",
    startsAt: toIso(row.start_date, row.start_time),
    durationMin: 60, // not stored; sensible default for display
    recurrence: recurrenceFromDays(row.days),
    maxCapacity: row.max_capacity ?? 0,
    currentCount: row.current_count ?? 0,
    isPaid: row.is_paid ?? false,
    priceUsd: row.price ?? undefined,
    isPublished: true,
  };
}

/** Wizard form payload — the new shape the wizard emits. */
export type ContentWizardPayload = {
  kind: ContentKind;
  name: string;
  description: string;
  speakerName: string;
  imageUrl?: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string | null; // YYYY-MM-DD or null/undefined for indefinite
  startTime: string; // HH:MM (24h)
  days: Weekday[]; // [] for one-off events
  maxCapacity: number;
  isPaid: boolean;
  priceUsd?: number;
};

export function payloadToInsert(p: ContentWizardPayload, mosqueId: string) {
  return {
    mosque_id: mosqueId,
    type: p.kind,
    name: p.name.trim(),
    description: p.description?.trim() || null,
    image: p.imageUrl?.trim() || null,
    speakers: p.speakerName ? [p.speakerName] : [],
    days: p.days,
    start_date: p.startDate,
    end_date: p.endDate || null,
    start_time: p.startTime,
    is_paid: p.isPaid,
    price: p.isPaid ? p.priceUsd ?? 0 : null,
    max_capacity: p.maxCapacity,
    is_weekly_program: p.kind === "program" && p.days.length > 0,
  };
}
