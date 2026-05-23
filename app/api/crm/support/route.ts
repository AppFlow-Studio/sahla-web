import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireCrmAccess } from "@/lib/supabase/requireCrmAccess";

/**
 * Posts a mosque admin's support message to the Sahla support Slack
 * channel via a webhook. No incoming-reply story yet — we tell the
 * admin we'll respond by email. Future: persist to a `support_messages`
 * table + thread incoming Slack replies back.
 */

const SUPPORT_WEBHOOK = process.env.SUPPORT_SLACK_WEBHOOK_URL;

export async function POST(request: Request) {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) {
    return NextResponse.json(
      { error: "HQ preview — sign in as a mosque admin to send a message." },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { message?: string }
    | null;
  const message = body?.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Message body is required" }, { status: 400 });
  }
  if (message.length > 4000) {
    return NextResponse.json(
      { error: "Message too long (max 4000 chars)" },
      { status: 400 }
    );
  }

  // Resolve mosque context for the Slack payload.
  const supabase = createAdminSupabaseClient();
  const { data: mosque } = await supabase
    .from("mosques")
    .select("id, name, email, phone")
    .eq("id", access.mosqueId)
    .maybeSingle();

  const session = await auth();
  const senderName =
    (session?.sessionClaims?.fullName as string | undefined) ??
    (session?.sessionClaims?.email as string | undefined) ??
    "A mosque admin";
  const senderEmail =
    (session?.sessionClaims?.email as string | undefined) ?? null;

  // Fire to Slack if configured. Either way, we still log the send so
  // mosque support history isn't lost during local dev or webhook outages.
  let webhookOk = false;
  let webhookError: string | null = null;

  if (SUPPORT_WEBHOOK) {
    try {
      const text = [
        `💬 *Support message from ${mosque?.name ?? "a mosque"}*`,
        `> ${message.replace(/\n/g, "\n> ")}`,
        "",
        `*From:* ${senderName}${senderEmail ? ` (${senderEmail})` : ""}`,
        `*Mosque:* ${mosque?.name ?? "?"} (\`${access.mosqueId}\`)`,
        mosque?.email ? `*Reply to:* ${mosque.email}` : null,
        mosque?.phone ? `*Phone:* ${mosque.phone}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      const res = await fetch(SUPPORT_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      webhookOk = res.ok;
      if (!res.ok) {
        webhookError = `Slack webhook returned ${res.status}`;
      }
    } catch (err) {
      webhookError =
        err instanceof Error ? err.message : "Slack webhook request failed";
    }
  } else {
    webhookError = "Slack webhook not configured (set SUPPORT_SLACK_WEBHOOK_URL)";
    console.warn(
      "[/api/crm/support] " + webhookError + " — message logged to activity_log only."
    );
  }

  // Always log to activity_log so the mosque has a record of what they sent.
  await supabase.from("activity_log").insert({
    mosque_id: access.mosqueId,
    actor_id: access.userId,
    actor_name: senderName,
    action: "support_message_sent",
    entity_type: "support",
    entity_id: null,
    entity_name: message.slice(0, 80),
    metadata: {
      sender_email: senderEmail,
      slack_delivered: webhookOk,
    },
  });

  return NextResponse.json({
    ok: true,
    deliveredToSlack: webhookOk,
    webhookError: webhookOk ? null : webhookError,
  });
}
