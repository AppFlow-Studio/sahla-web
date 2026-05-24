import { auth, clerkClient } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const SAHLA_HQ_ORG_ID = process.env.NEXT_PUBLIC_SAHLA_ORG_ID;

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

  // D2 from the CRM gap plan: log theme changes to the activity feed.
  // Fire-and-forget when brand_color / accent_color / logo_url move so the
  // mosque admin's Home dashboard shows "<You> updated theme".
  const themeFields = ["brand_color", "accent_color", "logo_url"] as const;
  const themeChanged = themeFields.some((f) => f in updateData);
  if (themeChanged) {
    const actorName =
      (session?.sessionClaims?.fullName as string | undefined) ??
      (session?.sessionClaims?.email as string | undefined) ??
      "An admin";
    void supabase.from("activity_log").insert({
      mosque_id: mosqueId,
      actor_id: session.userId,
      actor_name: actorName,
      action: "theme_updated",
      entity_type: "mosque",
      entity_id: mosqueId,
      entity_name: null,
      metadata: {
        changed: themeFields.filter((f) => f in updateData),
        brand_color: updateData.brand_color ?? null,
        accent_color: updateData.accent_color ?? null,
      },
    });
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
  if (!SAHLA_HQ_ORG_ID || session.orgId !== SAHLA_HQ_ORG_ID) {
    return NextResponse.json(
      { error: "Forbidden — Sahla HQ membership required" },
      { status: 403 }
    );
  }

  const { id: mosqueId } = await params;
  if (!mosqueId?.trim()) {
    return NextResponse.json({ error: "Missing mosque ID." }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  const { data: mosque, error: readError } = await supabase
    .from("mosques")
    .select("id, name, onboarding_status, clerk_org_id")
    .eq("id", mosqueId)
    .maybeSingle();

  // If no mosque row exists, this might be a pipeline-only lead — delete just the pipeline row
  if (readError || !mosque) {
    const { data: pipelineRow, error: pipelineReadError } = await supabase
      .from("pipeline_stages")
      .select("id, mosque_name")
      .eq("id", mosqueId)
      .maybeSingle();

    if (pipelineReadError || !pipelineRow) {
      return NextResponse.json({ error: "Mosque not found." }, { status: 404 });
    }

    const { error: pipelineDeleteError } = await supabase
      .from("pipeline_stages")
      .delete()
      .eq("id", pipelineRow.id);

    if (pipelineDeleteError) {
      return NextResponse.json(
        { error: `Failed to delete lead: ${pipelineDeleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, name: pipelineRow.mosque_name });
  }

  // Refuse to delete paying customers via this admin action — they should
  // be archived through a real churn flow, not nuked from the kanban menu.
  if (mosque.onboarding_status === "ready" || mosque.onboarding_status === "live") {
    return NextResponse.json(
      {
        error: `Cannot delete a ${mosque.onboarding_status} mosque from the pipeline. Reach out to engineering if this is intentional.`,
      },
      { status: 409 }
    );
  }

  // If a Clerk org is linked, delete it first. This also fires the
  // organization.deleted webhook, which would no-op against the row we're
  // about to delete.
  if (mosque.clerk_org_id) {
    try {
      const client = await clerkClient();
      await client.organizations.deleteOrganization(mosque.clerk_org_id);
    } catch (err) {
      // Org may already be gone in Clerk (manual deletion). Swallow 404-ish
      // errors and proceed; surface anything else as a 500.
      const message = err instanceof Error ? err.message : "Unknown Clerk error";
      const isNotFound = /not found|404/i.test(message);
      if (!isNotFound) {
        console.error(`Failed to delete Clerk org ${mosque.clerk_org_id}:`, message);
        return NextResponse.json(
          { error: `Failed to delete Clerk organization: ${message}` },
          { status: 500 }
        );
      }
    }
  }

  for (const table of CHILD_TABLES) {
    const { error } = await supabase.from(table).delete().eq("mosque_id", mosqueId);
    if (error) {
      console.error(`Failed to delete from ${table}:`, error.message);
    }
  }

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
