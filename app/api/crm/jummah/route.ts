import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireCrmAccess } from "@/lib/supabase/requireCrmAccess";

export type CrmJummahSlot = {
  id: string;
  prayerTime: string; // "12:15", "13:30", etc.
  topic: string | null;
  speakerId: string | null;
  speakerName: string | null;
  capacityStatus: string | null;
};

type JummahRow = {
  id: number;
  prayer_time: string | null;
  topic: string | null;
  speaker: string | null;
  khateeb_name: string | null;
  capacity_status: string | null;
};

type SpeakerRow = {
  speaker_id: string;
  speaker_name: string | null;
};

function rowToSlot(
  row: JummahRow,
  speakersById: Map<string, SpeakerRow>
): CrmJummahSlot {
  // Prefer the linked speaker's name; fall back to the free-text khateeb_name
  // captured during onboarding (before the admin had a speaker registry).
  const linkedName = row.speaker
    ? speakersById.get(row.speaker)?.speaker_name ?? null
    : null;
  return {
    id: String(row.id),
    prayerTime: row.prayer_time ?? "13:00",
    topic: row.topic ?? null,
    speakerId: row.speaker ?? null,
    speakerName: linkedName ?? row.khateeb_name ?? null,
    capacityStatus: row.capacity_status ?? null,
  };
}

export async function GET() {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) return NextResponse.json({ slots: [] });

  const supabase = createAdminSupabaseClient();

  const [jummahRes, speakersRes] = await Promise.all([
    supabase
      .from("jummah")
      .select("id, prayer_time, topic, speaker, khateeb_name, capacity_status")
      .eq("mosque_id", access.mosqueId)
      .order("prayer_time", { ascending: true }),
    supabase
      .from("speaker_data")
      .select("speaker_id, speaker_name")
      .eq("mosque_id", access.mosqueId),
  ]);

  if (jummahRes.error) {
    return NextResponse.json({ error: jummahRes.error.message }, { status: 500 });
  }

  const speakersById = new Map<string, SpeakerRow>();
  for (const s of (speakersRes.data as SpeakerRow[] | null) ?? []) {
    speakersById.set(s.speaker_id, s);
  }

  const slots: CrmJummahSlot[] = ((jummahRes.data as JummahRow[] | null) ?? []).map(
    (r) => rowToSlot(r, speakersById)
  );

  return NextResponse.json({ slots });
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

  const body = (await request.json().catch(() => null)) as
    | { prayerTime?: string; topic?: string; speakerId?: string | null }
    | null;

  if (!body?.prayerTime?.trim()) {
    return NextResponse.json({ error: "prayerTime is required" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("jummah")
    .insert({
      mosque_id: access.mosqueId,
      prayer_time: body.prayerTime.trim(),
      topic: body.topic?.trim() || null,
      speaker: body.speakerId || null,
    })
    .select("id, prayer_time, topic, speaker, khateeb_name, capacity_status")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Resolve speaker name for the response so the client doesn't need a refetch.
  const speakersById = new Map<string, SpeakerRow>();
  if (body.speakerId) {
    const { data: sp } = await supabase
      .from("speaker_data")
      .select("speaker_id, speaker_name")
      .eq("speaker_id", body.speakerId)
      .maybeSingle();
    if (sp) speakersById.set(sp.speaker_id, sp as SpeakerRow);
  }

  const session = await auth();
  const actorName =
    (session?.sessionClaims?.fullName as string | undefined) ??
    (session?.sessionClaims?.email as string | undefined) ??
    "An admin";
  void supabase.from("activity_log").insert({
    mosque_id: access.mosqueId,
    actor_id: access.userId,
    actor_name: actorName,
    action: "jummah_added",
    entity_type: "jummah",
    entity_id: String((data as JummahRow).id),
    entity_name: body.topic?.trim() || `Jummah at ${body.prayerTime}`,
  });

  return NextResponse.json({ slot: rowToSlot(data as JummahRow, speakersById) });
}
