import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { markOnboardingStep } from "@/lib/supabase/onboarding";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: mosqueId } = await params;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // "program" or "event"

  const supabase = createAdminSupabaseClient();

  let query = supabase
    .from("content_items")
    .select("*")
    .eq("mosque_id", mosqueId)
    .order("created_at", { ascending: false });

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;

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
  const { type, name, description, image, speakers, days, start_date, end_date, start_time, gender, is_paid, price, is_kids, markComplete } = body;

  if (!type || !["program", "event"].includes(type)) {
    return NextResponse.json({ error: "Type must be program or event" }, { status: 400 });
  }

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("content_items")
    .insert({
      mosque_id: mosqueId,
      type,
      name: name.trim(),
      description: description || null,
      image: image || null,
      speakers: speakers || [],
      days: days || [],
      start_date: start_date || null,
      end_date: end_date || null,
      start_time: start_time || null,
      gender: gender || "All",
      is_paid: is_paid || false,
      price: is_paid ? (price || 0) : 0,
      is_kids: is_kids || false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (markComplete) {
    const taskKey = type === "program" ? "programs" : "events";
    await markOnboardingStep(supabase, mosqueId, taskKey);
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
  const contentId = searchParams.get("contentId");

  if (!contentId) {
    return NextResponse.json({ error: "Content ID required" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  const { error } = await supabase
    .from("content_items")
    .delete()
    .eq("content_id", contentId)
    .eq("mosque_id", mosqueId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
