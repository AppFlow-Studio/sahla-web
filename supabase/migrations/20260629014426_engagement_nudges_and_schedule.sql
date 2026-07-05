-- Reconstructed from staging (rpepxdgdiqeirdqsazuc) migration history: engagement_nudges_and_schedule
-- NT-ENGAGE-01 — Engagement-nudge sender infrastructure + cron schedule.
--
-- Project: STAGING (rpepxdgdiqeirdqsazuc).

-- 1. Per-user toggle. Defaults TRUE so new accounts get nudges out of the box.
ALTER TABLE public.user_notification_preferences
  ADD COLUMN IF NOT EXISTS engagement_nudges_enabled boolean NOT NULL DEFAULT true;

-- 2. Idempotency ledger. Claim row before send.
CREATE TABLE IF NOT EXISTS public.engagement_nudges_sent (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     text NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mosque_id   text NOT NULL REFERENCES public.mosques(id)  ON DELETE CASCADE,
  nudge_type  text NOT NULL,
  period_key  text NOT NULL,
  sent_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT engagement_nudges_sent_unique UNIQUE (user_id, mosque_id, nudge_type, period_key)
);

ALTER TABLE public.engagement_nudges_sent ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_engagement_nudges_sent_sent_at
  ON public.engagement_nudges_sent (sent_at);

-- 3. Cron schedule — every 15 minutes (engagement is daily-ish cadence,
--    not per-minute like prayer). URL is the staging Functions endpoint,
--    matching send-prayer-notifications convention.
SELECT cron.unschedule('send-engagement-nudges-every-15-min')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-engagement-nudges-every-15-min'
);

SELECT cron.schedule(
  'send-engagement-nudges-every-15-min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://rpepxdgdiqeirdqsazuc.supabase.co/functions/v1/send-engagement-nudges',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
