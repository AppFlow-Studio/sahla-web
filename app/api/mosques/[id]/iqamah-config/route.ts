import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import type { IqamahConfig } from "@/lib/prayer/types";

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
    .from("iqamah_config")
    .select("*")
    .eq("mosque_id", mosqueId)
    .order("prayer_name");

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
  const {
    configs,
    calculationMethod,
    school,
    address,
  }: {
    configs: IqamahConfig[];
    calculationMethod: number;
    school: number;
    address?: string;
  } = body;

  if (!configs || !Array.isArray(configs) || configs.length !== 5) {
    return NextResponse.json(
      { error: "Must provide exactly 5 iqamah configs" },
      { status: 400 }
    );
  }

  const supabase = createAdminSupabaseClient();

  // Update mosque calculation settings and get onboarding progress in one call
  const updateFields: Record<string, unknown> = {
    calculation_method: calculationMethod,
    school: school,
  };
  if (address) updateFields.address = address;

  const { data: mosqueData, error: mosqueError } = await supabase
    .from("mosques")
    .update(updateFields)
    .eq("id", mosqueId)
    .select("onboarding_progress")
    .single();

  if (mosqueError) {
    return NextResponse.json({ error: mosqueError.message }, { status: 500 });
  }

  // Upsert iqamah configs — delete existing then insert
  const { error: deleteError } = await supabase
    .from("iqamah_config")
    .delete()
    .eq("mosque_id", mosqueId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const rows = configs.map((c) => ({
    mosque_id: mosqueId,
    prayer_name: c.prayer_name,
    mode: c.mode,
    fixed_time: c.mode === "fixed" ? c.fixed_time : null,
    offset_minutes: c.mode === "offset" ? c.offset_minutes : null,
    seasonal_rules: c.mode === "seasonal" ? c.seasonal_rules : null,
  }));

  const { error: insertError } = await supabase
    .from("iqamah_config")
    .insert(rows);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Mark prayer_times as complete in onboarding progress
  if (mosqueData) {
    const progress = (mosqueData.onboarding_progress as Record<string, boolean>) || {};
    progress.prayer_times = true;
    await supabase
      .from("mosques")
      .update({ onboarding_progress: progress })
      .eq("id", mosqueId);
  }

  return NextResponse.json({ success: true });
}
