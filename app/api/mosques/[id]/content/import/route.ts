import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { markOnboardingStep } from "@/lib/supabase/onboarding";
import { NextResponse } from "next/server";

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
  const { type, rows }: { type: "program" | "event"; rows: Record<string, string>[] } = body;

  if (!type || !["program", "event"].includes(type)) {
    return NextResponse.json({ error: "Type must be program or event" }, { status: 400 });
  }

  if (!rows?.length) {
    return NextResponse.json({ error: "No rows to import" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  const insertRows = rows.map((row) => ({
    mosque_id: mosqueId,
    type,
    name: row.name?.trim() || "Untitled",
    description: row.description || null,
    speakers: row.speaker ? [row.speaker] : [],
    days: row.days ? row.days.split(",").map((d: string) => d.trim()) : [],
    start_date: row.start_date || null,
    end_date: row.end_date || null,
    start_time: row.start_time || null,
    gender: row.gender || "All",
    is_paid: row.is_paid === "true" || row.is_paid === "yes",
    price: row.price ? parseFloat(row.price) : 0,
    is_kids: row.is_kids === "true" || row.is_kids === "yes",
  }));

  const { data, error } = await supabase
    .from("content_items")
    .insert(insertRows)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mark task complete
  const taskKey = type === "program" ? "programs" : "events";
  await markOnboardingStep(supabase, mosqueId, taskKey);

  return NextResponse.json({ imported: data?.length || 0 });
}
