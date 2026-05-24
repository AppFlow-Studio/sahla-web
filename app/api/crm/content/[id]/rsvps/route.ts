import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireCrmAccess } from "@/lib/supabase/requireCrmAccess";
import type { ContentRsvp } from "@/app/(crm)/_mock/programs";

type RsvpRow = {
  id: number;
  user_id: string;
  content_id: string;
  status: string;
  reserved_at: string | null;
};

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
};

function initialsFrom(first: string | null, last: string | null): string {
  const f = first?.[0]?.toUpperCase() ?? "?";
  const l = last?.[0]?.toUpperCase() ?? "";
  return `${f}${l}`;
}

function nameFrom(first: string | null, last: string | null): string {
  const name = [first, last].filter(Boolean).join(" ").trim();
  return name || "Anonymous member";
}

function normalizeStatus(s: string): ContentRsvp["status"] {
  if (s === "paid" || s === "attended" || s === "waitlisted" || s === "canceled") {
    return s;
  }
  return "reserved";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) return NextResponse.json({ rsvps: [] });

  const { id } = await params;
  const supabase = createAdminSupabaseClient();

  const { data: rsvpRows, error: rsvpErr } = await supabase
    .from("rsvps")
    .select("id, user_id, content_id, status, reserved_at")
    .eq("mosque_id", access.mosqueId)
    .eq("content_id", id)
    .order("reserved_at", { ascending: false });

  if (rsvpErr) {
    return NextResponse.json({ error: rsvpErr.message }, { status: 500 });
  }

  const rows = (rsvpRows as RsvpRow[] | null) ?? [];
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));

  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", userIds.length > 0 ? userIds : ["__none__"]);

  const profilesById = new Map<string, ProfileRow>();
  for (const p of (profileRows as ProfileRow[] | null) ?? []) {
    profilesById.set(p.id, p);
  }

  const rsvps: ContentRsvp[] = rows.map((r) => {
    const p = profilesById.get(r.user_id);
    return {
      id: String(r.id),
      contentId: r.content_id,
      memberName: nameFrom(p?.first_name ?? null, p?.last_name ?? null),
      memberInitials: initialsFrom(p?.first_name ?? null, p?.last_name ?? null),
      status: normalizeStatus(r.status),
      reservedAt: r.reserved_at ?? new Date().toISOString(),
    };
  });

  return NextResponse.json({ rsvps });
}
