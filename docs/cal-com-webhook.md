# Cal.com → pipeline sync

Cal.com bookings automatically move waitlist leads through the Sahla CRM
pipeline. Booking a call flips a `lead` row to `contacted`; the
`contacted → demo` promotion happens only after the meeting actually
finishes (via Cal.com's `MEETING_ENDED` webhook). No-shows stay at
`contacted` because they cancelled first.

## How it works

1. Waitlist visitor submits the form → row created in `pipeline_stages`
   at stage `lead`. Confirmation email includes a "Book your call" button
   linking to `https://cal.com/ahmad-hamoudeh-kc7pje/sahla-intro-call`
   with `?name=…&email=…&notes=Waitlist:%20<mosque>` pre-filled.
2. Visitor books on Cal.com → Cal.com POSTs a `BOOKING_CREATED` webhook
   to the `cal-webhook` edge function.
3. Edge function verifies the signature, looks up the pipeline row by
   attendee email, advances stage to `contacted`, stamps
   `next_booking_at` + `cal_booking_uid`, and appends a "Booked call for
   `<time>`" note.
4. When the meeting's scheduled end time hits, Cal.com fires
   `MEETING_ENDED`. The edge function matches by `cal_booking_uid`,
   advances stage to `demo`, clears `next_booking_at` +
   `cal_booking_uid`, and appends a "Demo call completed" note.
5. If the booking is rescheduled or cancelled, Cal.com fires the
   matching event and the edge function updates the row accordingly
   (cancel clears the booking-time fields but does **not** revert stage;
   `MEETING_ENDED` won't fire for a cancelled booking).

## One-time setup

### 1. Add the webhook secret to Supabase

Supabase dashboard → **Edge Functions → Secrets**. Add:

- `CAL_WEBHOOK_SECRET` — the value shown by Cal.com when you create the
  webhook (step 3 below). Set this **before** deploying the edge function
  so the first request doesn't 401.

Repeat for both **staging** and **main** projects.

### 2. Deploy the migration + edge function

```bash
# Staging first (per the team workflow rule).
supabase db push --project-ref <staging-ref>
supabase functions deploy cal-webhook --project-ref <staging-ref>

# Then main.
supabase db push --project-ref <main-ref>
supabase functions deploy cal-webhook --project-ref <main-ref>
```

Migrations involved:
- `20260715120000_pipeline_cal_booking_fields.sql` — adds
  `next_booking_at` and `cal_booking_uid` columns to `pipeline_stages`
  (originally also scheduled a 1-hour-before pg_cron promotion job).
- `20260715180000_drop_promote_pipeline_to_demo_cron.sql` — removes
  that pg_cron job now that `MEETING_ENDED` handles the promotion.

### 3. Register the webhook in Cal.com

Cal.com dashboard → **Settings → Developer → Webhooks → New Webhook**:

- **Subscriber URL**:
  - Staging: `https://<staging-ref>.supabase.co/functions/v1/cal-webhook`
  - Prod:    `https://<main-ref>.supabase.co/functions/v1/cal-webhook`
- **Event triggers** (check all four):
  - `BOOKING_CREATED`
  - `BOOKING_RESCHEDULED`
  - `BOOKING_CANCELLED`
  - `MEETING_ENDED`
- **Payload template**: leave default (Cal.com's standard JSON — the
  function's `CalWebhookEvent` type matches).
- Copy the **Secret** Cal.com generates and paste it into Supabase as
  `CAL_WEBHOOK_SECRET` (step 1 above) if you haven't already.

Two webhooks total — one for the staging project, one for prod.

### 4. Test end-to-end

1. Book a slot on Cal.com using an email that already exists in
   `pipeline_stages.contact_email` (or submit the waitlist form first).
2. In Supabase → **Edge Functions → Logs**, confirm the request came in
   and returned `200 { ok: true, matched: true }`.
3. In the CRM pipeline, that row should now be at `contacted` with a
   `next_booking_at` timestamp visible in the row detail (and a "Booked
   call for `<time>`" note in the notes JSON).
4. Wait until the meeting's scheduled end time. Cal.com fires
   `MEETING_ENDED`; the row should flip from `contacted` → `demo` and
   `next_booking_at` should clear. (For a fast test, book a 15-min slot
   at the top of the hour and wait 15 min.)

## Troubleshooting

- **`401 Invalid signature`** — `CAL_WEBHOOK_SECRET` in Supabase doesn't
  match the secret Cal.com is using. Re-copy from Cal.com dashboard.
- **`200 { matched: false, reason: "no pipeline row for email" }`** —
  someone booked with an email that isn't in `pipeline_stages`. Expected
  for anyone finding your Cal.com link outside the waitlist flow. If it
  should have matched, check for a typo / case-sensitivity issue (the
  function uses `ilike` for the lookup).
- **`MEETING_ENDED` didn't fire** — Cal.com sends this at the meeting's
  scheduled end time, not necessarily when the call actually ends. If
  the row is still at `contacted` after the scheduled end, check the
  edge function logs for the event, and confirm `MEETING_ENDED` is
  enabled on the Cal.com webhook.
- **Reschedule didn't take effect** — the function matches
  `BOOKING_RESCHEDULED` by the `rescheduleUid` in the payload (Cal.com's
  reference to the *previous* booking uid). If a row was rescheduled but
  we never received the original `BOOKING_CREATED`, the reschedule has
  nothing to match. Confirm the original booking existed in
  `pipeline_stages.cal_booking_uid`.
