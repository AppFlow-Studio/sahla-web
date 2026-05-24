import { NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

type EditContactBody = {
  mosqueId?: string;
  contactName?: string | null;
  contactEmail?: string | null;
};

export async function POST(req: Request) {
  const body = (await req.json()) as EditContactBody;
  const mosqueId = body.mosqueId?.trim();

  if (!mosqueId) {
    return NextResponse.json(
      { error: "mosqueId is required." },
      { status: 400 },
    );
  }

  const contactName =
    typeof body.contactName === "string" ? body.contactName.trim() : null;
  const contactEmail =
    typeof body.contactEmail === "string" ? body.contactEmail.trim() : null;

  const supabase = await createClerkSupabaseClient();
  const updatedAt = new Date().toISOString();

  // Try matching by mosque_id first, then fall back to the row's own id
  const { data: updatedRows, error } = await supabase
    .from("pipeline_stages")
    .update({
      contact_name: contactName ?? "",
      contact_email: contactEmail ?? "",
      updated_at: updatedAt,
    })
    .or(`mosque_id.eq.${mosqueId},id.eq.${mosqueId}`)
    .select("id");

  if (error) {
    return NextResponse.json(
      { error: `Failed to update contact: ${error.message}` },
      { status: 500 },
    );
  }

  if (!updatedRows || updatedRows.length === 0) {
    return NextResponse.json(
      { error: "Lead not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, updatedAt });
}
