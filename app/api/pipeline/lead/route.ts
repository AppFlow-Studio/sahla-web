import { NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

type LeadBody = {
  mosqueName?: string;
  city?: string;
  state?: string;
  contactName?: string;
  contactEmail?: string;
  notes?: string;
};

function createSlug(name: string) {
  const base =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "mosque";
  const suffix = Date.now().toString(36);
  return `${base}-${suffix}`;
}

async function insertNote(
  supabase: Awaited<ReturnType<typeof createClerkSupabaseClient>>,
  mosqueId: string,
  noteText: string
) {
  const attempts = [
    { mosque_id: mosqueId, note: noteText },
    { mosque_id: mosqueId, content: noteText },
    { mosque_id: mosqueId, body: noteText },
    { mosque_id: mosqueId, text: noteText },
  ];
  let lastError: string | null = null;
  for (const payload of attempts) {
    const { error } = await supabase.from("mosque_notes").insert(payload);
    if (!error) return;
    lastError = error.message;
  }
  throw new Error(lastError ?? "Failed to insert mosque note.");
}

/**
 * Internal-only: capture a possible lead. No Clerk org, no invite.
 * Confirmed clients use POST /api/pipeline/create-account instead.
 */
export async function POST(req: Request) {
  let body: LeadBody;
  try {
    body = (await req.json()) as LeadBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const mosqueName = (body.mosqueName ?? "").trim();
  if (!mosqueName) {
    return NextResponse.json(
      { error: "Mosque name is required." },
      { status: 400 }
    );
  }

  const city = (body.city ?? "").trim() || null;
  const state = (body.state ?? "").trim() || null;
  const contactName = (body.contactName ?? "").trim() || null;
  const contactEmail = (body.contactEmail ?? "").trim() || null;
  const notes = (body.notes ?? "").trim() || null;

  const supabase = await createClerkSupabaseClient();
  const mosqueId = crypto.randomUUID();
  const slug = createSlug(mosqueName);

  const { data: mosqueRow, error: mosqueError } = await supabase
    .from("mosques")
    .insert({
      id: mosqueId,
      slug,
      name: mosqueName,
      city,
      state,
      onboarding_status: "pipeline",
    })
    .select("id, name")
    .single();

  if (mosqueError || !mosqueRow) {
    return NextResponse.json(
      { error: mosqueError?.message ?? "Failed to create mosque." },
      { status: 500 }
    );
  }

  const updatedAt = new Date().toISOString();
  const { error: stageError } = await supabase.from("pipeline_stages").insert({
    mosque_id: mosqueRow.id,
    stage: "lead",
    contact_name: contactName,
    updated_at: updatedAt,
  });

  if (stageError) {
    return NextResponse.json(
      {
        error: `Mosque saved, but pipeline stage failed: ${stageError.message}`,
      },
      { status: 500 }
    );
  }

  const noteParts: string[] = [];
  if (contactEmail) noteParts.push(`Contact email: ${contactEmail}`);
  if (notes) noteParts.push(notes);
  if (noteParts.length > 0) {
    try {
      await insertNote(supabase, String(mosqueRow.id), noteParts.join("\n"));
    } catch (e) {
      return NextResponse.json(
        {
          error:
            e instanceof Error
              ? `Lead saved, but note failed: ${e.message}`
              : "Lead saved, but note failed.",
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    {
      ok: true,
      mosqueName: mosqueRow.name ?? mosqueName,
      updatedAt,
    },
    { status: 200 }
  );
}
