import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
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
    .from("jummah")
    .select("*")
    .eq("mosque_id", mosqueId)
    .order("prayer_time");

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
  const { slots } = await request.json();

  if (!slots || !Array.isArray(slots) || slots.length === 0) {
    return NextResponse.json({ error: "At least one jummah slot is required" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  // Delete existing and insert new
  const { error: deleteError } = await supabase
    .from("jummah")
    .delete()
    .eq("mosque_id", mosqueId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const rows = slots.map((slot: { time: string; khateeb_name?: string; topic?: string; capacity_status?: string }) => ({
    mosque_id: mosqueId,
    prayer_time: slot.time,
    topic: slot.topic || null,
    capacity_status: slot.capacity_status || null,
  }));

  const { error: insertError } = await supabase
    .from("jummah")
    .insert(rows);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Mark jummah_setup complete in onboarding progress
  const { data: mosque } = await supabase
    .from("mosques")
    .select("onboarding_progress")
    .eq("id", mosqueId)
    .single();

  if (mosque) {
    const progress = (mosque.onboarding_progress as Record<string, boolean>) || {};
    progress.jummah_setup = true;
    await supabase
      .from("mosques")
      .update({ onboarding_progress: progress })
      .eq("id", mosqueId);
  }

  return NextResponse.json({ success: true });
}
