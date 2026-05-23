import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireCrmAccess } from "@/lib/supabase/requireCrmAccess";

/**
 * Union shared with the client `ActivityEvent` type. Kept in sync by hand
 * for now; lift to a shared type module if we add a 5th consumer.
 */
export type CrmActivityEvent =
  | {
      kind: "donation";
      id: string;
      occurredAt: string;
      donorHash: string;
      amountUsd: number;
      fundLabel: string;
    }
  | {
      kind: "member";
      id: string;
      occurredAt: string;
      memberName: string;
    }
  | {
      kind: "rsvp";
      id: string;
      occurredAt: string;
      memberName: string;
      contentName: string;
      contentKind: "program" | "event";
    }
  | {
      kind: "content";
      id: string;
      occurredAt: string;
      contentName: string;
      contentKind: "program" | "event";
      actorName: string | null;
    }
  | {
      kind: "notification";
      id: string;
      occurredAt: string;
      title: string;
      recipientCount: number;
    }
  | {
      kind: "settings";
      id: string;
      occurredAt: string;
      label: string; // "theme", "prayer times", etc.
      actorName: string | null;
    };

type ActivityRow = {
  id: string;
  action: string | null;
  actor_id: string | null;
  actor_name: string | null;
  entity_type: string | null;
  entity_id: string | null;
  entity_name: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
};

type ContentRow = {
  content_id: string;
  name: string | null;
  type: string | null;
};

function donorHashFor(seed: string | null): string {
  if (!seed) return "Anonymous";
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return `D${Math.abs(h).toString(36).slice(0, 4).toUpperCase()}`;
}

function profileName(p: ProfileRow | undefined): string {
  if (!p) return "A member";
  const n = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
  return n || "A member";
}

/**
 * Map a raw activity_log row into the CRM-facing event union. Returns null
 * for rows that aren't meaningful to a mosque admin (HQ ops, pipeline
 * transitions, etc.) so the feed stays focused.
 *
 * RSVP rows need profile + content_items lookups because the PG trigger
 * (log_rsvp_created) can't reach Clerk display names or join across
 * schemas. Caller batch-fetches and passes the maps in.
 */
function toEvent(
  row: ActivityRow,
  profiles: Map<string, ProfileRow>,
  contents: Map<string, ContentRow>
): CrmActivityEvent | null {
  const action = row.action ?? "";
  const ts = row.created_at;

  if (action === "donation_received" || action === "payment_succeeded") {
    const amount = Number(row.metadata?.amount ?? row.metadata?.amountGiven ?? 0);
    const fund =
      (row.metadata?.fund as string | undefined) ??
      (row.metadata?.project_donated_to as string[] | undefined)?.[0] ??
      "General Fund";
    return {
      kind: "donation",
      id: row.id,
      occurredAt: ts,
      donorHash: donorHashFor(row.actor_id || row.entity_id),
      amountUsd: Math.round(amount * 100) / 100,
      fundLabel: fund,
    };
  }

  if (action === "user_signup") {
    return {
      kind: "member",
      id: row.id,
      occurredAt: ts,
      memberName: row.entity_name ?? row.actor_name ?? "A new member",
    };
  }

  if (action === "rsvp_created") {
    const contentId = row.metadata?.content_id as string | undefined;
    const content = contentId ? contents.get(contentId) : undefined;
    const memberName =
      row.actor_name ??
      profileName(row.actor_id ? profiles.get(row.actor_id) : undefined);
    return {
      kind: "rsvp",
      id: row.id,
      occurredAt: ts,
      memberName,
      contentName: content?.name ?? "an event",
      contentKind: content?.type === "event" ? "event" : "program",
    };
  }

  if (action === "content_created") {
    const type = (row.metadata?.type as string | undefined) ?? "program";
    return {
      kind: "content",
      id: row.id,
      occurredAt: ts,
      contentName: row.entity_name ?? "Untitled",
      contentKind: type === "event" ? "event" : "program",
      actorName: row.actor_name,
    };
  }

  if (action === "notification_sent" || action === "notification.sent") {
    return {
      kind: "notification",
      id: row.id,
      occurredAt: ts,
      title: row.entity_name ?? "Notification",
      recipientCount: Number(row.metadata?.recipient_count ?? 0),
    };
  }

  if (action === "theme_updated" || action === "prayer_times_updated") {
    return {
      kind: "settings",
      id: row.id,
      occurredAt: ts,
      label: action === "theme_updated" ? "theme" : "prayer times",
      actorName: row.actor_name,
    };
  }

  // HQ-only events (pipeline, org, team_member, role, user_removed) are
  // skipped — they belong in the admin tree, not the mosque admin's feed.
  return null;
}

export async function GET(request: Request) {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;

  if (access.isHQ) {
    return NextResponse.json({ events: [] satisfies CrmActivityEvent[] });
  }

  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get("limit"));
  const limit =
    Number.isFinite(limitParam) && limitParam > 0 && limitParam <= 100
      ? limitParam
      : 24;

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("activity_log")
    .select(
      "id, action, actor_id, actor_name, entity_type, entity_id, entity_name, metadata, created_at"
    )
    .eq("mosque_id", access.mosqueId)
    .order("created_at", { ascending: false })
    .limit(limit * 2); // Over-fetch a bit since some rows get filtered out by toEvent.

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data as ActivityRow[] | null) ?? [];

  // Collect lookups needed for the RSVP rows in one batch each.
  const rsvpRows = rows.filter((r) => r.action === "rsvp_created");
  const actorIds = Array.from(
    new Set(rsvpRows.map((r) => r.actor_id).filter((x): x is string => !!x))
  );
  const contentIds = Array.from(
    new Set(
      rsvpRows
        .map((r) => r.metadata?.content_id as string | undefined)
        .filter((x): x is string => !!x)
    )
  );

  const [profilesRes, contentsRes] = await Promise.all([
    actorIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", actorIds)
      : Promise.resolve({ data: [] as ProfileRow[] }),
    contentIds.length > 0
      ? supabase
          .from("content_items")
          .select("content_id, name, type")
          .in("content_id", contentIds)
      : Promise.resolve({ data: [] as ContentRow[] }),
  ]);

  const profiles = new Map<string, ProfileRow>();
  for (const p of (profilesRes.data as ProfileRow[] | null) ?? []) {
    profiles.set(p.id, p);
  }
  const contents = new Map<string, ContentRow>();
  for (const c of (contentsRes.data as ContentRow[] | null) ?? []) {
    contents.set(c.content_id, c);
  }

  const events = rows
    .map((r) => toEvent(r, profiles, contents))
    .filter((e): e is CrmActivityEvent => e !== null)
    .slice(0, limit);

  return NextResponse.json({ events });
}
