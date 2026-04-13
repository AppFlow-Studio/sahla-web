-- Prayer Times Cron Jobs
-- Requires pg_cron and pg_net extensions (enabled in Supabase dashboard)

-- Monthly athan fetch: 1st of each month at 2 AM UTC
SELECT cron.schedule(
  'sync-prayer-times-monthly',
  '0 2 1 * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/sync-prayer-times',
    body := '{"action": "fetch_month"}'::jsonb,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key'),
      'Content-Type', 'application/json'
    )
  );
  $$
);

-- Daily iqamah computation: 2:30 AM UTC every day
SELECT cron.schedule(
  'sync-prayer-times-daily',
  '30 2 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/sync-prayer-times',
    body := '{"action": "compute_today"}'::jsonb,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key'),
      'Content-Type', 'application/json'
    )
  );
  $$
);
