import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { markOnboardingStep } from "@/lib/supabase/onboarding";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: mosqueId } = await params;
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("speaker_data")
    .select("*")
    .eq("mosque_id", mosqueId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: mosqueId } = await params;
  const body = await request.json();
  const { speaker_name, speaker_img, speaker_creds, markComplete } = body;

  if (!speaker_name?.trim()) {
    return NextResponse.json({ error: "Speaker name is required" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("speaker_data")
    .insert({
      mosque_id: mosqueId,
      speaker_name: speaker_name.trim(),
      speaker_img: speaker_img || null,
      speaker_creds: speaker_creds || [],
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (markComplete) {
    await markOnboardingStep(supabase, mosqueId, "speakers");
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: mosqueId } = await params;
  const { searchParams } = new URL(request.url);
  const speakerId = searchParams.get("speakerId");

  if (!speakerId) {
    return NextResponse.json({ error: "Speaker ID required" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  const { error } = await supabase
    .from("speaker_data")
    .delete()
    .eq("speaker_id", speakerId)
    .eq("mosque_id", mosqueId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
