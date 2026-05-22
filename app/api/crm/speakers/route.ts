import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireCrmAccess } from "@/lib/supabase/requireCrmAccess";

export type CrmSpeaker = {
  id: string;
  name: string;
  credentials: string;
  bio: string;
  photoUrl: string;
  programsCount: number;
  lastSpokeAt: string | null;
  email?: string;
};

type SpeakerRow = {
  speaker_id: string;
  speaker_name: string | null;
  speaker_img: string | null;
  speaker_creds: string[] | null;
  speaker_bio: string | null;
  speaker_email: string | null;
};

function rowToCrm(row: SpeakerRow): CrmSpeaker {
  return {
    id: row.speaker_id,
    name: row.speaker_name ?? "Untitled speaker",
    credentials: (row.speaker_creds ?? []).join(" · "),
    bio: row.speaker_bio ?? "",
    photoUrl: row.speaker_img ?? "",
    programsCount: 0, // TODO: derive from content_items.speakers FK
    lastSpokeAt: null,
    email: row.speaker_email ?? undefined,
  };
}

/** Split a CRM "credentials" string on " · " or "," into the DB array. */
function credsToArray(input: string): string[] {
  return input
    .split(/[·,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function GET() {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) {
    return NextResponse.json({ speakers: [] satisfies CrmSpeaker[] });
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("speaker_data")
    .select("speaker_id, speaker_name, speaker_img, speaker_creds, speaker_bio, speaker_email")
    .eq("mosque_id", access.mosqueId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    speakers: ((data as SpeakerRow[] | null) ?? []).map(rowToCrm),
  });
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
    | { name?: string; credentials?: string; bio?: string; photoUrl?: string; email?: string }
    | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("speaker_data")
    .insert({
      mosque_id: access.mosqueId,
      speaker_name: body.name.trim(),
      speaker_img: body.photoUrl?.trim() || null,
      speaker_creds: credsToArray(body.credentials ?? ""),
      speaker_bio: body.bio?.trim() || null,
      speaker_email: body.email?.trim() || null,
    })
    .select("speaker_id, speaker_name, speaker_img, speaker_creds, speaker_bio, speaker_email")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Activity log — fire-and-forget so latency doesn't bottleneck the form.
  const session = await auth();
  const actorName =
    session?.sessionClaims?.fullName ??
    (session?.sessionClaims?.email as string | undefined) ??
    "An admin";
  void supabase.from("activity_log").insert({
    mosque_id: access.mosqueId,
    actor_id: access.userId,
    actor_name: actorName,
    action: "speaker_added",
    entity_type: "speaker",
    entity_id: (data as SpeakerRow).speaker_id,
    entity_name: (data as SpeakerRow).speaker_name,
  });

  return NextResponse.json({ speaker: rowToCrm(data as SpeakerRow) });
}

export async function PATCH(request: Request) {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) {
    return NextResponse.json(
      { error: "HQ preview can't write — sign in as a mosque admin." },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { id?: string; name?: string; credentials?: string; bio?: string; photoUrl?: string; email?: string }
    | null;
  if (!body?.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (typeof body.name === "string") updates.speaker_name = body.name.trim();
  if (typeof body.credentials === "string")
    updates.speaker_creds = credsToArray(body.credentials);
  if (typeof body.bio === "string") updates.speaker_bio = body.bio.trim() || null;
  if (typeof body.photoUrl === "string")
    updates.speaker_img = body.photoUrl.trim() || null;
  if (typeof body.email === "string")
    updates.speaker_email = body.email.trim() || null;

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("speaker_data")
    .update(updates)
    .eq("speaker_id", body.id)
    .eq("mosque_id", access.mosqueId)
    .select("speaker_id, speaker_name, speaker_img, speaker_creds, speaker_bio, speaker_email")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ speaker: rowToCrm(data as SpeakerRow) });
}

export async function DELETE(request: Request) {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) {
    return NextResponse.json(
      { error: "HQ preview can't write — sign in as a mosque admin." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id query param required" }, { status: 400 });

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("speaker_data")
    .delete()
    .eq("speaker_id", id)
    .eq("mosque_id", access.mosqueId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
