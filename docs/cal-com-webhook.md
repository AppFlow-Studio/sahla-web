# Cal.com → pipeline sync

Cal.com bookings automatically move waitlist leads through the Sahla CRM
pipeline. Booking a call flips a `lead` row to `contacted` and stamps
the appointment time; the `contacted → demo` promotion happens
automatically one hour before the call via `pg_cron`.

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
4. Every 5 min, `pg_cron` scans for `contacted` rows whose
   `next_booking_at` is within the next hour and promotes them to `demo`.
5. If the booking is rescheduled or cancelled, Cal.com fires the
   matching event and the edge function updates the row accordingly
   (cancel clears the booking-time fields but does **not** revert stage).

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

The migration `20260715120000_pipeline_cal_booking_fields.sql` adds two
columns to `pipeline_stages` (`next_booking_at`, `cal_booking_uid`) and
schedules the pg_cron promotion job.

### 3. Register the webhook in Cal.com

Cal.com dashboard → **Settings → Developer → Webhooks → New Webhook**:

- **Subscriber URL**:
  - Staging: `https://<staging-ref>.supabase.co/functions/v1/cal-webhook`
  - Prod:    `https://<main-ref>.supabase.co/functions/v1/cal-webhook`
- **Event triggers** (check all three):
  - `BOOKING_CREATED`
  - `BOOKING_RESCHEDULED`
  - `BOOKING_CANCELLED`
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
4. Wait until one hour before the call (or fudge `next_booking_at` in
   the DB for a test row) and confirm the cron promotes it to `demo`
   within 5 minutes.

## Troubleshooting

- **`401 Invalid signature`** — `CAL_WEBHOOK_SECRET` in Supabase doesn't
  match the secret Cal.com is using. Re-copy from Cal.com dashboard.
- **`200 { matched: false, reason: "no pipeline row for email" }`** —
  someone booked with an email that isn't in `pipeline_stages`. Expected
  for anyone finding your Cal.com link outside the waitlist flow. If it
  should have matched, check for a typo / case-sensitivity issue (the
  function uses `ilike` for the lookup).
- **Cron didn't fire** — check `SELECT * FROM cron.job WHERE jobname =
  'promote-pipeline-to-demo'` and `SELECT * FROM cron.job_run_details
  ORDER BY start_time DESC LIMIT 5` for the last few runs.
- **Reschedule didn't take effect** — the function matches
  `BOOKING_RESCHEDULED` by the `rescheduleUid` in the payload (Cal.com's
  reference to the *previous* booking uid). If a row was rescheduled but
  we never received the original `BOOKING_CREATED`, the reschedule has
  nothing to match. Confirm the original booking existed in
  `pipeline_stages.cal_booking_uid`.
