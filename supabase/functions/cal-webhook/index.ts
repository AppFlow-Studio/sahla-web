// supabase/functions/cal-webhook/index.ts
// ============================================================================
// Cal.com Webhook Handler — Supabase Edge Function
// ============================================================================
//
// Receives Cal.com booking events and keeps the CRM pipeline in sync with
// what's on the Sahla team's calendar.
//
// Events handled:
//   BOOKING_CREATED     → match attendee email to pipeline_stages row,
//                         advance stage 'lead' | 'contacted' → 'contacted',
//                         stamp next_booking_at + cal_booking_uid,
//                         append a "Booked call for <time>" note
//   BOOKING_RESCHEDULED → match by rescheduleUid, update next_booking_at
//                         and cal_booking_uid to the new booking, append note
//   BOOKING_CANCELLED   → match by uid, clear next_booking_at + cal_booking_uid,
//                         append "Call cancelled" note. Stage is NOT reverted —
//                         keeps the audit trail cleaner.
//   MEETING_ENDED       → match by uid, advance 'contacted' → 'demo',
//                         clear next_booking_at + cal_booking_uid, append
//                         "Demo call completed" note. This is what actually
//                         moves a booked-and-attended call into the demo
//                         stage — no-shows never fire MEETING_ENDED because
//                         they cancelled first, so they stay at 'contacted'
//                         (correctly).
//
// Setup:
//   1. Set CAL_WEBHOOK_SECRET in Supabase Dashboard → Edge Functions → Secrets
//   2. In Cal.com Dashboard → Settings → Developer → Webhooks → New:
//      URL: https://<project-ref>.supabase.co/functions/v1/cal-webhook
//      Events: BOOKING_CREATED, BOOKING_RESCHEDULED, BOOKING_CANCELLED, MEETING_ENDED
//      Copy the "Secret" Cal.com generates → paste into Supabase as CAL_WEBHOOK_SECRET
//
// ============================================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const webhookSecret = Deno.env.get("CAL_WEBHOOK_SECRET") ?? "";

// ── Types (partial — only the fields we read) ──────────────────────────────

type CalAttendee = { email: string; name?: string };

type CalBookingPayload = {
  uid: string;
  title?: string;
  startTime: string;
  endTime?: string;
  attendees: CalAttendee[];
  // Present on BOOKING_RESCHEDULED — the UID of the booking being replaced.
  rescheduleUid?: string;
  cancellationReason?: string;
  location?: string;
};

type CalWebhookEvent = {
  triggerEvent:
    | "BOOKING_CREATED"
    | "BOOKING_RESCHEDULED"
    | "BOOKING_CANCELLED"
    | "MEETING_ENDED"
    | string;
  createdAt?: string;
  payload: CalBookingPayload;
};

// ── HMAC verification ──────────────────────────────────────────────────────

/**
 * Verify Cal.com's HMAC-SHA256 signature over the raw request body.
 * Cal.com sends the hex digest in `X-Cal-Signature-256`. Compares via
 * timingSafeEqual to avoid leaking timing info about secret length.
 */
async function verifyCalSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): Promise<boolean> {
  if (!signatureHeader || !secret) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(rawBody)
  );
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (expected.length !== signatureHeader.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signatureHeader.charCodeAt(i);
  }
  return mismatch === 0;
}

// ── Pipeline helpers ───────────────────────────────────────────────────────

type PipelineNote = { text: string; at: string };

/**
 * Append a new note entry to the pipeline_stages.notes JSON array.
 * Preserves whatever's already there so we don't lose earlier context.
 */
function appendNote(
  current: unknown,
  text: string
): PipelineNote[] {
  const existing = Array.isArray(current) ? (current as PipelineNote[]) : [];
  return [...existing, { text, at: new Date().toISOString() }];
}

function formatBookingTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/New_York",
    }) + " ET";
  } catch {
    return iso;
  }
}

// ── Event handlers ─────────────────────────────────────────────────────────

async function handleBookingCreated(event: CalWebhookEvent) {
  const { payload } = event;
  const attendeeEmail = payload.attendees?.[0]?.email?.toLowerCase();
  if (!attendeeEmail) {
    return { matched: false, reason: "no attendee email" };
  }

  const { data: row } = await supabase
    .from("pipeline_stages")
    .select("id, stage, notes")
    .ilike("contact_email", attendeeEmail)
    .maybeSingle();

  if (!row) {
    return { matched: false, reason: "no pipeline row for email" };
  }

  // Only advance forward — never demote a further-along lead just because
  // they booked a call. If they're already at demo/contract/onboarding/live,
  // just stamp the booking and add the note.
  const nextStage =
    row.stage === "lead" || row.stage === "contacted"
      ? "contacted"
      : row.stage;

  const note = `Booked Cal.com call for ${formatBookingTime(payload.startTime)}`;

  const { error } = await supabase
    .from("pipeline_stages")
    .update({
      stage: nextStage,
      next_booking_at: payload.startTime,
      cal_booking_uid: payload.uid,
      notes: appendNote(row.notes, note),
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  if (error) throw error;
  return { matched: true, pipelineId: row.id, newStage: nextStage };
}

async function handleBookingRescheduled(event: CalWebhookEvent) {
  const { payload } = event;
  // On reschedule Cal.com issues a NEW uid and includes the previous one
  // in rescheduleUid. We match on the previous uid so we can find the row.
  const priorUid = payload.rescheduleUid;
  if (!priorUid) {
    return { matched: false, reason: "no rescheduleUid" };
  }

  const { data: row } = await supabase
    .from("pipeline_stages")
    .select("id, notes")
    .eq("cal_booking_uid", priorUid)
    .maybeSingle();

  if (!row) {
    return { matched: false, reason: "no pipeline row for prior uid" };
  }

  const note = `Call rescheduled to ${formatBookingTime(payload.startTime)}`;

  const { error } = await supabase
    .from("pipeline_stages")
    .update({
      next_booking_at: payload.startTime,
      cal_booking_uid: payload.uid,
      notes: appendNote(row.notes, note),
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  if (error) throw error;
  return { matched: true, pipelineId: row.id };
}

async function handleMeetingEnded(event: CalWebhookEvent) {
  const { payload } = event;
  const { data: row } = await supabase
    .from("pipeline_stages")
    .select("id, stage, notes")
    .eq("cal_booking_uid", payload.uid)
    .maybeSingle();

  if (!row) {
    return { matched: false, reason: "no pipeline row for uid" };
  }

  // Only advance forward. If they somehow already moved past demo (e.g. HQ
  // moved them to 'contract' during the call), leave the stage alone but
  // still stamp the note + clear the booking fields.
  const nextStage =
    row.stage === "lead" || row.stage === "contacted" ? "demo" : row.stage;

  const { error } = await supabase
    .from("pipeline_stages")
    .update({
      stage: nextStage,
      next_booking_at: null,
      cal_booking_uid: null,
      notes: appendNote(row.notes, `Demo call completed`),
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  if (error) throw error;
  return { matched: true, pipelineId: row.id, newStage: nextStage };
}

async function handleBookingCancelled(event: CalWebhookEvent) {
  const { payload } = event;
  const { data: row } = await supabase
    .from("pipeline_stages")
    .select("id, notes")
    .eq("cal_booking_uid", payload.uid)
    .maybeSingle();

  if (!row) {
    return { matched: false, reason: "no pipeline row for uid" };
  }

  const reason = payload.cancellationReason?.trim();
  const note = reason
    ? `Call cancelled — reason: ${reason}`
    : `Call cancelled`;

  // Clear the booking-time fields so the CRM stops showing a stale
  // upcoming call. Stage stays as-is (audit-trail cleaner than reverting).
  const { error } = await supabase
    .from("pipeline_stages")
    .update({
      next_booking_at: null,
      cal_booking_uid: null,
      notes: appendNote(row.notes, note),
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  if (error) throw error;
  return { matched: true, pipelineId: row.id };
}

// ── HTTP entry point ───────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-cal-signature-256");

  const valid = await verifyCalSignature(rawBody, signature, webhookSecret);
  if (!valid) {
    console.warn("[cal-webhook] signature mismatch");
    return new Response("Invalid signature", { status: 401 });
  }

  let event: CalWebhookEvent;
  try {
    event = JSON.parse(rawBody) as CalWebhookEvent;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  try {
    let result;
    switch (event.triggerEvent) {
      case "BOOKING_CREATED":
        result = await handleBookingCreated(event);
        break;
      case "BOOKING_RESCHEDULED":
        result = await handleBookingRescheduled(event);
        break;
      case "BOOKING_CANCELLED":
        result = await handleBookingCancelled(event);
        break;
      case "MEETING_ENDED":
        result = await handleMeetingEnded(event);
        break;
      default:
        // Unknown/unhandled event — ack so Cal.com doesn't retry.
        return new Response(
          JSON.stringify({ ok: true, ignored: event.triggerEvent }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
    }

    console.log(`[cal-webhook] ${event.triggerEvent}`, result);
    return new Response(JSON.stringify({ ok: true, ...result }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[cal-webhook] ${event.triggerEvent} failed:`, message);
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
});
