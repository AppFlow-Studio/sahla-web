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

/**
 * Internal-only: capture a possible lead. No Clerk org, no invite, no mosque row.
 * The mosque record is created later when the lead reaches onboarding.
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
  const contactName = (body.contactName ?? "").trim() || null;
  const contactEmail = (body.contactEmail ?? "").trim() || null;
  const notes = (body.notes ?? "").trim() || null;

  const supabase = await createClerkSupabaseClient();
  const updatedAt = new Date().toISOString();

  const noteEntries = [];
  if (contactEmail) noteEntries.push(`Contact email: ${contactEmail}`);
  if (notes) noteEntries.push(notes);
  const notesJson = noteEntries.length > 0
    ? JSON.stringify([{ text: noteEntries.join("\n"), at: updatedAt }])
    : "[]";

  const { error: stageError } = await supabase.from("pipeline_stages").insert({
    stage: "lead",
    mosque_name: mosqueName,
    city,
    contact_name: contactName,
    contact_email: contactEmail,
    notes: notesJson,
    updated_at: updatedAt,
  });

  if (stageError) {
    return NextResponse.json(
      { error: `Failed to create lead: ${stageError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      mosqueName,
      updatedAt,
    },
    { status: 200 }
  );
}
