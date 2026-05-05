import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const ALLOWED_FIELDS = [
  "name", "address", "city", "state", "phone", "email", "timezone",
  "app_name", "logo_url", "brand_color", "accent_color", "secondary_color",
  "calculation_method", "school",
];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: mosqueId } = await params;
  const body = await request.json();
  const { markComplete, ...fields } = body;

  // Filter to allowed fields only
  const updateData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (ALLOWED_FIELDS.includes(key)) {
      updateData[key] = value;
    }
  }

  const supabase = createAdminSupabaseClient();

  // Update mosque fields + get current onboarding_progress
  const { data: mosque, error } = await supabase
    .from("mosques")
    .update(updateData)
    .eq("id", mosqueId)
    .select("onboarding_progress")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mark task complete if requested
  if (markComplete && typeof markComplete === "string") {
    const progress = (mosque?.onboarding_progress as Record<string, boolean>) || {};
    progress[markComplete] = true;
    await supabase
      .from("mosques")
      .update({ onboarding_progress: progress })
      .eq("id", mosqueId);
  }

  return NextResponse.json({ success: true });
}

/* ── Delete a mosque and all related data ── */

const CHILD_TABLES = [
  "pipeline_stages",
  "mosque_notes",
  "mosque_onboarding_steps",
  "mosque_notification_config",
  "mosque_health_scores",
  "iqamah_config",
  "activity_log",
  "ad_pricing_config",
  "ad_subscriptions",
  "approved_business_ads",
  "business_ads_submissions",
  "capacity_alert_subscribers",
  "content_forms",
  "content_items",
  "content_notification_schedule",
  "content_notification_settings",
  "content_notifications",
  "content_tags",
  "display_categories",
  "donations",
  "jummah",
  "jummah_notifications",
  "lectures",
  "liked_lectures",
  "nudge_dismissals",
  "prayer_display_config",
  "prayer_notification_schedule",
  "prayer_notification_settings",
  "prayers",
  "projects",
  "push_tokens",
  "quran_playlist",
  "ramadan_quran_tracker",
  "recommendation_log",
  "saved_content",
  "speaker_data",
  "taraweeh_lineup",
  "todays_prayers",
  "user_bookmarked_ayahs",
  "user_bookmarked_surahs",
  "user_cart",
  "user_content_interactions",
  "user_continue_read",
  "user_islamic_goals",
  "user_islamic_interests",
  "user_liked_ayahs",
  "user_liked_surahs",
  "user_playlist",
  "user_playlist_lectures",
  "user_preferences",
];

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: mosqueId } = await params;
  if (!mosqueId?.trim()) {
    return NextResponse.json({ error: "Missing mosque ID." }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  // Verify mosque exists
  const { data: mosque, error: readError } = await supabase
    .from("mosques")
    .select("id, name")
    .eq("id", mosqueId)
    .single();

  if (readError || !mosque) {
    return NextResponse.json({ error: "Mosque not found." }, { status: 404 });
  }

  // Delete from all child tables first (FK constraints)
  for (const table of CHILD_TABLES) {
    const { error } = await supabase.from(table).delete().eq("mosque_id", mosqueId);
    if (error) {
      console.error(`Failed to delete from ${table}:`, error.message);
      // Continue — some tables may have no rows for this mosque
    }
  }

  // Delete the mosque itself
  const { error: deleteError } = await supabase
    .from("mosques")
    .delete()
    .eq("id", mosqueId);

  if (deleteError) {
    return NextResponse.json(
      { error: `Failed to delete mosque: ${deleteError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, name: mosque.name });
}
