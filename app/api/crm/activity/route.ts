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

function donorHashFor(seed: string | null): string {
  if (!seed) return "Anonymous";
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return `D${Math.abs(h).toString(36).slice(0, 4).toUpperCase()}`;
}

/**
 * Map a raw activity_log row into the CRM-facing event union. Returns null
 * for rows that aren't meaningful to a mosque admin (HQ ops, pipeline
 * transitions, etc.) so the feed stays focused.
 */
function toEvent(row: ActivityRow): CrmActivityEvent | null {
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
  const limit = Number.isFinite(limitParam) && limitParam > 0 && limitParam <= 100
    ? limitParam
    : 24;

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("activity_log")
    .select("id, action, actor_id, actor_name, entity_type, entity_id, entity_name, metadata, created_at")
    .eq("mosque_id", access.mosqueId)
    .order("created_at", { ascending: false })
    .limit(limit * 2); // Over-fetch a bit since some rows get filtered out by toEvent.

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const events = ((data as ActivityRow[] | null) ?? [])
    .map(toEvent)
    .filter((e): e is CrmActivityEvent => e !== null)
    .slice(0, limit);

  return NextResponse.json({ events });
}
