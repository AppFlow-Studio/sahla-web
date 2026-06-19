import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireCrmAccess } from "@/lib/supabase/requireCrmAccess";

/**
 * Enqueue a push notification onto `scheduled_notifications`. This is the only
 * way content enters the send pipeline, and it's behind requireCrmAccess.
 *
 * Delivery is owned by the `send-push` edge function (the drain worker):
 *   - immediate sends: we insert a row dated now() and kick the worker inline,
 *     then read back the row so the UI gets real sent/failed counts.
 *   - scheduled sends: we insert a future-dated row; the per-minute cron drains
 *     it when due.
 */

type AudienceType = "all" | "program" | "event";

type SendBody = {
  title?: string;
  body?: string;
  audienceType?: AudienceType;
  audienceTarget?: string | null;
  audienceLabel?: string;
  templateId?: string | null;
  scheduledFor?: string | null;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) {
    return NextResponse.json({ error: "HQ preview can't send." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as SendBody | null;

  if (!body?.title?.trim() || !body.body?.trim()) {
    return NextResponse.json(
      { error: "title and body are required" },
      { status: 400 }
    );
  }

  const audienceType: AudienceType = body.audienceType ?? "all";
  if (!["all", "program", "event"].includes(audienceType)) {
    return NextResponse.json(
      { error: `Unsupported audience '${audienceType}'.` },
      { status: 400 }
    );
  }

  // program/event must name a valid content_id (uuid); 'all' has no target.
  let audienceTarget: string | null = null;
  if (audienceType !== "all") {
    const target = body.audienceTarget?.trim();
    if (!target || !UUID_RE.test(target)) {
      return NextResponse.json(
        { error: "A program or event must be selected." },
        { status: 400 }
      );
    }
    audienceTarget = target;
  }

  // Parse the optional schedule. Anything in the past (or absent) is immediate.
  const now = Date.now();
  let scheduledFor = new Date(now).toISOString();
  let isScheduled = false;
  if (body.scheduledFor) {
    const ts = Date.parse(body.scheduledFor);
    if (Number.isNaN(ts)) {
      return NextResponse.json(
        { error: "Invalid scheduledFor date." },
        { status: 400 }
      );
    }
    if (ts > now + 30_000) {
      scheduledFor = new Date(ts).toISOString();
      isScheduled = true;
    }
  }

  const templateId =
    body.templateId && Number.isFinite(Number(body.templateId))
      ? Number(body.templateId)
      : null;

  const session = await auth();
  const actorName =
    (session?.sessionClaims?.fullName as string | undefined) ??
    (session?.sessionClaims?.email as string | undefined) ??
    "An admin";

  const supabase = createAdminSupabaseClient();

  const { data: queued, error: insErr } = await supabase
    .from("scheduled_notifications")
    .insert({
      mosque_id: access.mosqueId,
      title: body.title.trim(),
      body: body.body.trim(),
      audience_type: audienceType,
      audience_target: audienceTarget,
      audience_label: body.audienceLabel ?? null,
      template_id: templateId,
      created_by: access.userId,
      actor_name: actorName,
      scheduled_for: scheduledFor,
      status: "pending",
    })
    .select("id")
    .single();

  if (insErr || !queued) {
    return NextResponse.json(
      { error: insErr?.message ?? "Could not queue notification." },
      { status: 500 }
    );
  }

  if (isScheduled) {
    return NextResponse.json({ ok: true, scheduled: true, scheduledFor });
  }

  // Immediate: kick the drain worker now so we don't wait for the cron, then
  // read back the row for accurate counts. If the kick fails, the cron is the
  // safety net — the row is already durably queued.
  await kickDrainWorker();

  const { data: row } = await supabase
    .from("scheduled_notifications")
    .select("status, sent_count, failed_count, recipient_count, activity_log_id")
    .eq("id", queued.id)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    scheduled: false,
    queuedId: queued.id,
    status: row?.status ?? "pending",
    sentCount: row?.sent_count ?? null,
    failedCount: row?.failed_count ?? null,
    recipientCount: row?.recipient_count ?? null,
    historyId: row?.activity_log_id ?? null,
  });
}

async function kickDrainWorker(): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) return;
  try {
    await fetch(`${baseUrl}/functions/v1/send-push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
  } catch {
    // Non-fatal: the per-minute cron will drain the row.
  }
}
