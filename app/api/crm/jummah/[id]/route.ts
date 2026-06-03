import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireCrmAccess } from "@/lib/supabase/requireCrmAccess";

type JummahRow = {
  id: number;
  prayer_time: string | null;
  topic: string | null;
  speaker: string | null;
  capacity_status: string | null;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) {
    return NextResponse.json(
      { error: "HQ preview can't write — sign in as a mosque admin." },
      { status: 403 }
    );
  }

  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as
    | { prayerTime?: string; topic?: string; speakerId?: string | null }
    | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof body.prayerTime === "string") updates.prayer_time = body.prayerTime.trim();
  if (typeof body.topic === "string") updates.topic = body.topic.trim() || null;
  if (body.speakerId === null || typeof body.speakerId === "string")
    updates.speaker = body.speakerId || null;

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("jummah")
    .update(updates)
    .eq("id", numericId)
    .eq("mosque_id", access.mosqueId)
    .select("id, prayer_time, topic, speaker, capacity_status")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const row = data as JummahRow;
  return NextResponse.json({
    slot: {
      id: String(row.id),
      prayerTime: row.prayer_time ?? "13:00",
      topic: row.topic ?? null,
      speakerId: row.speaker ?? null,
      speakerName: null, // client refetches list after edits
      capacityStatus: row.capacity_status ?? null,
    },
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) {
    return NextResponse.json(
      { error: "HQ preview can't write — sign in as a mosque admin." },
      { status: 403 }
    );
  }

  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("jummah")
    .delete()
    .eq("id", numericId)
    .eq("mosque_id", access.mosqueId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
