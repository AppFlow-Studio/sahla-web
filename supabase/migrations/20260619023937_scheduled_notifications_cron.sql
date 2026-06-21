-- Drain the scheduled_notifications queue once a minute.
-- ----------------------------------------------------------------------------
-- Calls the `send-push` edge function, which claims any due `pending` rows and
-- delivers them. This is both the scheduled-send path and a safety net for
-- immediate sends whose inline drain call failed.
--
-- NOTE: send-push must be deployed with verify_jwt = false (see config.toml) so
-- this cron can invoke it without an Authorization header. Deploy the function
-- BEFORE applying this migration:
--   supabase functions deploy send-push
--
-- Applied to staging (rpepxdgdiqeirdqsazuc) only.

SELECT cron.unschedule('drain-scheduled-notifications')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'drain-scheduled-notifications');

SELECT cron.schedule(
  'drain-scheduled-notifications',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://rpepxdgdiqeirdqsazuc.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
