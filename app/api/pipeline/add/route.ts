import { NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

type AddLeadRequest = {
  mosqueName?: string;
  city?: string;
  state?: string;
  contactName?: string;
  contactEmail?: string;
  notes?: string;
};

type NormalizedLead = {
  mosqueName: string;
  city: string | null;
  state: string | null;
  contactName: string | null;
  contactEmail: string | null;
  notes: string | null;
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

function normalize(body: AddLeadRequest): NormalizedLead {
  const mosqueName = (body.mosqueName ?? "").trim();
  const city = (body.city ?? "").trim();
  const state = (body.state ?? "").trim();
  const contactName = (body.contactName ?? "").trim();
  const contactEmail = (body.contactEmail ?? "").trim();
  const notes = (body.notes ?? "").trim();

  return {
    mosqueName,
    city: city || null,
    state: state || null,
    contactName: contactName || null,
    contactEmail: contactEmail || null,
    notes: notes || null,
  };
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

export async function POST(req: Request) {
  const body = (await req.json()) as AddLeadRequest;
  const lead = normalize(body);

  if (!lead.mosqueName) {
    return NextResponse.json(
      { error: "Mosque name is required." },
      { status: 400 }
    );
  }

  const supabase = await createClerkSupabaseClient();
  const mosqueId = crypto.randomUUID();
  const mosqueSlug = createSlug(lead.mosqueName);

  const { data: mosqueRow, error: mosqueError } = await supabase
    .from("mosques")
    .insert({
      id: mosqueId,
      slug: mosqueSlug,
      name: lead.mosqueName,
      city: lead.city,
      state: lead.state,
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
    contact_name: lead.contactName,
    updated_at: updatedAt,
  });

  if (stageError) {
    return NextResponse.json(
      { error: `Mosque created, but failed to create pipeline stage: ${stageError.message}` },
      { status: 500 }
    );
  }

  if (lead.notes) {
    const noteText = lead.contactEmail
      ? `Contact Email: ${lead.contactEmail}\n${lead.notes}`
      : lead.notes;

    try {
      await insertNote(supabase, String(mosqueRow.id), noteText);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? `Lead created, but failed to save note: ${error.message}`
              : "Lead created, but failed to save note.",
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { ok: true, mosqueName: mosqueRow.name ?? lead.mosqueName, updatedAt },
    { status: 200 }
  );
}



