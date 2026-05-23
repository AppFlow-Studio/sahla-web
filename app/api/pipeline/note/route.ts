import { NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

type NoteBody = {
  mosqueId?: string;
  note?: string;
};

export async function POST(req: Request) {
  let body: NoteBody;
  try {
    body = (await req.json()) as NoteBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const mosqueId = (body.mosqueId ?? "").trim();
  const note = (body.note ?? "").trim();

  if (!mosqueId) {
    return NextResponse.json({ error: "mosqueId is required." }, { status: 400 });
  }
  if (!note) {
    return NextResponse.json({ error: "note is required." }, { status: 400 });
  }

  const supabase = await createClerkSupabaseClient();

  // Check if this ID belongs to a mosque or is a pipeline-only lead
  const { data: mosqueRow } = await supabase
    .from("mosques")
    .select("id")
    .eq("id", mosqueId)
    .maybeSingle();

  if (mosqueRow) {
    // Mosque exists — store note in mosque_notes
    const { error } = await supabase.from("mosque_notes").insert({
      mosque_id: mosqueId,
      content: note,
    });

    if (error) {
      return NextResponse.json(
        { error: `Failed to insert note: ${error.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // Pipeline-only lead — append to pipeline_stages.notes jsonb
  const { data: pipelineRow, error: readError } = await supabase
    .from("pipeline_stages")
    .select("id, notes")
    .or(`id.eq.${mosqueId},mosque_id.eq.${mosqueId}`)
    .limit(1)
    .maybeSingle();

  if (readError || !pipelineRow) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  const existing = Array.isArray(pipelineRow.notes) ? pipelineRow.notes : [];
  const updated = [...existing, { text: note, at: new Date().toISOString() }];

  const { error: updateError } = await supabase
    .from("pipeline_stages")
    .update({ notes: updated })
    .eq("id", pipelineRow.id);

  if (updateError) {
    return NextResponse.json(
      { error: `Failed to save note: ${updateError.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
