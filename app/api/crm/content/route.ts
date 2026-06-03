import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireCrmAccess } from "@/lib/supabase/requireCrmAccess";
import {
  rowToContentItem,
  payloadToInsert,
  type ContentRow,
  type ContentWizardPayload,
} from "./_lib/mapping";

const SELECT_COLS =
  "content_id, mosque_id, type, name, description, image, speakers, days, start_date, end_date, start_time, is_paid, price, max_capacity, current_count, is_weekly_program";

export async function GET(request: Request) {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) return NextResponse.json({ items: [] });

  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind"); // "program" | "event" | null

  const supabase = createAdminSupabaseClient();
  let q = supabase
    .from("content_items")
    .select(SELECT_COLS)
    .eq("mosque_id", access.mosqueId)
    .order("start_date", { ascending: true })
    .limit(200);
  if (kind === "program" || kind === "event") q = q.eq("type", kind);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = ((data as ContentRow[] | null) ?? []).map(rowToContentItem);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) {
    return NextResponse.json(
      { error: "HQ preview can't write — sign in as a mosque admin." },
      { status: 403 }
    );
  }

  const payload = (await request.json().catch(() => null)) as
    | ContentWizardPayload
    | null;
  if (!payload || !payload.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!payload.startDate || !payload.startTime) {
    return NextResponse.json(
      { error: "startDate and startTime are required" },
      { status: 400 }
    );
  }
  if (payload.kind !== "program" && payload.kind !== "event") {
    return NextResponse.json(
      { error: "kind must be 'program' or 'event'" },
      { status: 400 }
    );
  }

  const supabase = createAdminSupabaseClient();
  const insertRow = payloadToInsert(payload, access.mosqueId);

  const { data, error } = await supabase
    .from("content_items")
    .insert(insertRow)
    .select(SELECT_COLS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit + activity feed. Triggers cover `content_created` already, but we
  // overwrite with actor_name from the route so the Home feed shows display
  // names (the trigger can't read Clerk).
  const session = await auth();
  const actorName =
    (session?.sessionClaims?.fullName as string | undefined) ??
    (session?.sessionClaims?.email as string | undefined) ??
    "An admin";
  void supabase.from("activity_log").insert({
    mosque_id: access.mosqueId,
    actor_id: access.userId,
    actor_name: actorName,
    action: "content_created",
    entity_type: "content_item",
    entity_id: (data as ContentRow).content_id,
    entity_name: (data as ContentRow).name,
    metadata: { type: (data as ContentRow).type },
  });

  return NextResponse.json({ item: rowToContentItem(data as ContentRow) });
}
