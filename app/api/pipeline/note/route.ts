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

  const attempts = [
    { mosque_id: mosqueId, note },
    { mosque_id: mosqueId, content: note },
    { mosque_id: mosqueId, body: note },
    { mosque_id: mosqueId, text: note },
  ];

  let lastError: string | null = null;
  for (const payload of attempts) {
    const { error } = await supabase.from("mosque_notes").insert(payload);
    if (!error) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }
    lastError = error.message;
  }

  return NextResponse.json(
    { error: lastError ?? "Failed to insert note." },
    { status: 500 },
  );
}
