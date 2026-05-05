/**
 * Fired when a masjid admin leaves the onboarding flow without finishing it
 * — either by clicking "Back to Sahla" in the sidebar or by closing the tab
 * (browser fires beforeunload → navigator.sendBeacon).
 *
 * Sends a one-time "resume your setup" email via Resend. Subsequent calls for
 * the same mosque are no-ops until the row is reset (e.g. by the
 * clerk-webhooks org.deleted handler).
 *
 * Idempotency:
 *   We perform an atomic UPDATE-with-WHERE on `mosques.resume_email_sent_at`
 *   so concurrent requests can't both send. The first request to flip the
 *   column from null → now() owns the send.
 */
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = "Sahla <no-reply@sahla.co>";

export async function POST(req: Request) {
  const session = await auth();
  if (!session.userId || !session.orgId) {
    // No session or no active mosque org — nothing to do, succeed silently
    // so beacons from logged-out states don't show as errors in the dashboard.
    return NextResponse.json({ ok: true, skipped: "no-session" });
  }

  const supabase = createAdminSupabaseClient();

  // Look up the mosque this user is in. We only fire for mosques actively in
  // onboarding — completed ones don't need a resume email.
  const { data: mosque } = await supabase
    .from("mosques")
    .select("id, name, onboarding_status, resume_email_sent_at")
    .or(`clerk_org_id.eq.${session.orgId},id.eq.${session.orgId}`)
    .limit(1)
    .single();

  if (!mosque) {
    return NextResponse.json({ ok: true, skipped: "no-mosque" });
  }
  if (mosque.onboarding_status !== "in_progress") {
    return NextResponse.json({ ok: true, skipped: "not-in-progress" });
  }
  if (mosque.resume_email_sent_at) {
    return NextResponse.json({ ok: true, skipped: "already-sent" });
  }

  // Atomic claim: only one concurrent request flips this from null → now().
  // The PostgREST .is("resume_email_sent_at", null) clause becomes a SQL
  // `WHERE resume_email_sent_at IS NULL` predicate.
  const claimedAt = new Date().toISOString();
  const { data: claimed, error: claimError } = await supabase
    .from("mosques")
    .update({ resume_email_sent_at: claimedAt })
    .eq("id", mosque.id)
    .is("resume_email_sent_at", null)
    .select("id")
    .maybeSingle();

  if (claimError) {
    console.error(
      `leave-notify: failed to claim resume_email_sent_at for ${mosque.id}:`,
      claimError.message
    );
    return NextResponse.json({ ok: false, error: "claim-failed" }, { status: 500 });
  }

  if (!claimed) {
    // Another concurrent request already claimed the row — that one will send.
    return NextResponse.json({ ok: true, skipped: "raced" });
  }

  // Get the signed-in user's primary email from Clerk.
  let recipientEmail: string | null = null;
  let firstName: string | null = null;
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(session.userId);
    const primaryId = user.primaryEmailAddressId;
    const primary =
      user.emailAddresses.find((e) => e.id === primaryId) ?? user.emailAddresses[0];
    recipientEmail = primary?.emailAddress ?? null;
    firstName = user.firstName ?? null;
  } catch (err) {
    console.error("leave-notify: failed to fetch Clerk user:", err);
  }

  if (!recipientEmail) {
    // No email to send to — leave the timestamp set so we don't keep retrying
    // each beacon from this user. They'll have to come back on their own.
    return NextResponse.json({ ok: true, skipped: "no-recipient" });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || new URL(req.url).origin;
  const resumeUrl = `${baseUrl}/onboarding`;
  const mosqueName = mosque.name?.trim() || "your masjid";

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: recipientEmail,
      subject: `Continue setting up ${mosqueName}`,
      html: resumeEmailHtml({ firstName, mosqueName, resumeUrl }),
      text: resumeEmailText({ firstName, mosqueName, resumeUrl }),
    });
  } catch (err) {
    // Email failed. Leaving resume_email_sent_at set is a tradeoff: we won't
    // spam them on every navigation, but they also won't get a retry. Acceptable
    // for now — the link in the navbar / landing page CTA still gets them back in.
    console.error("leave-notify: Resend send failed:", err);
    return NextResponse.json({ ok: false, error: "send-failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sent: true });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resumeEmailHtml({
  firstName,
  mosqueName,
  resumeUrl,
}: {
  firstName: string | null;
  mosqueName: string;
  resumeUrl: string;
}) {
  const greeting = firstName
    ? `Hey ${escapeHtml(firstName)},`
    : `Hey there,`;
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fffbf2;padding:32px 16px;color:#0a261e;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid rgba(13,38,30,0.06);border-radius:16px;padding:36px;">
        <div style="margin-bottom:24px;">
          <span style="display:inline-block;padding:4px 10px;font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#1a6b42;background:rgba(26,107,66,0.08);border-radius:999px;">Sahla</span>
        </div>
        <h1 style="font-size:24px;line-height:1.3;margin:0 0 16px;color:#0a261e;">Pick up where you left off.</h1>
        <p style="font-size:15px;line-height:1.7;margin:0 0 16px;color:rgba(13,38,30,0.75);">${greeting}</p>
        <p style="font-size:15px;line-height:1.7;margin:0 0 24px;color:rgba(13,38,30,0.75);">
          You started setting up <strong>${escapeHtml(mosqueName)}</strong> on Sahla but didn't finish.
          Your progress is saved — pick up exactly where you left off whenever you're ready.
        </p>
        <a href="${resumeUrl}" style="display:inline-block;padding:12px 22px;background:#0a261e;color:#fffbf2;font-size:14px;font-weight:600;text-decoration:none;border-radius:10px;">Continue setup</a>
        <p style="font-size:13px;line-height:1.7;margin:28px 0 0;color:rgba(13,38,30,0.5);">
          Need a hand? Reply to this email and we'll help you get unstuck.
        </p>
      </div>
    </div>
  `;
}

function resumeEmailText({
  firstName,
  mosqueName,
  resumeUrl,
}: {
  firstName: string | null;
  mosqueName: string;
  resumeUrl: string;
}) {
  const greeting = firstName ? `Hey ${firstName},` : `Hey there,`;
  return [
    greeting,
    "",
    `You started setting up ${mosqueName} on Sahla but didn't finish. Your progress is saved — pick up exactly where you left off:`,
    "",
    resumeUrl,
    "",
    "Need a hand? Reply to this email and we'll help you get unstuck.",
    "",
    "— Sahla",
  ].join("\n");
}
