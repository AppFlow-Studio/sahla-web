import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireCrmAccess } from "@/lib/supabase/requireCrmAccess";

/**
 * Stub for the "send notification" action. We persist the event to
 * activity_log (so it shows in the Home feed + notifications history)
 * but DO NOT actually push to Expo/APNs/FCM yet. Real delivery is a
 * separate phase — see plan §"Out of scope" for the dependencies.
 */
export async function POST(request: Request) {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) {
    return NextResponse.json(
      { error: "HQ preview can't send." },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => null)) as
    | {
        title?: string;
        body?: string;
        audienceLabel?: string;
        recipientCount?: number;
        templateId?: string | null;
        scheduledFor?: string | null;
      }
    | null;

  if (!body?.title?.trim() || !body.body?.trim()) {
    return NextResponse.json(
      { error: "title and body are required" },
      { status: 400 }
    );
  }

  const audienceLabel = body.audienceLabel ?? "Everyone";
  const recipientCount = Math.max(0, Math.floor(body.recipientCount ?? 0));
  const session = await auth();
  const actorName =
    (session?.sessionClaims?.fullName as string | undefined) ??
    (session?.sessionClaims?.email as string | undefined) ??
    "An admin";

  const supabase = createAdminSupabaseClient();

  // Audit / activity feed row.
  const { data: activityRow, error: actErr } = await supabase
    .from("activity_log")
    .insert({
      mosque_id: access.mosqueId,
      actor_id: access.userId,
      actor_name: actorName,
      action: "notification_sent",
      entity_type: "notification",
      entity_name: body.title.trim(),
      metadata: {
        body: body.body.trim(),
        audience_label: audienceLabel,
        recipient_count: recipientCount,
        scheduled_for: body.scheduledFor ?? null,
        template_id: body.templateId ?? null,
      },
    })
    .select("id, created_at")
    .single();

  if (actErr) {
    return NextResponse.json({ error: actErr.message }, { status: 500 });
  }

  // Bump the template's usage counter if this send came from one.
  if (body.templateId) {
    const numericId = Number(body.templateId);
    if (Number.isFinite(numericId)) {
      const { data: tpl } = await supabase
        .from("notification_templates")
        .select("usage_count")
        .eq("id", numericId)
        .eq("mosque_id", access.mosqueId)
        .maybeSingle();
      if (tpl) {
        await supabase
          .from("notification_templates")
          .update({
            usage_count: (tpl.usage_count ?? 0) + 1,
            last_used_at: new Date().toISOString(),
          })
          .eq("id", numericId)
          .eq("mosque_id", access.mosqueId);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    historyId: activityRow?.id,
    sentAt: activityRow?.created_at,
    deliveryStubbed: true,
  });
}
