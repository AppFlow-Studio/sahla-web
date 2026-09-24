-- Point every scheduled net.http_post at the environment it runs in.
-- ----------------------------------------------------------------------------
-- 20260921120000 fixed the two prayer jobs. Auditing the rest of cron.job on
-- production turned up four more with the staging ref baked in, so prod's whole
-- scheduled layer was driving staging:
--
--   drain-scheduled-notifications           every minute  -> staging send-push
--   send-engagement-nudges-every-15-min     */15          -> staging send-engagement-nudges
--   sync-app-builds-daily                   03:00 daily   -> staging sync-app-builds
--   send-content-notifications-every-minute every minute  -> staging send-content-notifications
--
-- The consequences are the same shape as the prayer bug: production's own
-- `scheduled_notifications` queue was never drained (the every-minute job
-- drained STAGING's), prod nudges and content notifications never went out, and
-- staging's functions were invoked twice a minute — once by its own cron and
-- once by production's.
--
-- Nothing here is env-specific: every URL resolves through public.project_url(),
-- which reads public.app_config in whichever database it runs in. Each project
-- still needs its one row (see 20260921120000 for the insert).
--
-- cron.schedule() upserts by name, so re-running is safe and job ids are kept.

do $$
declare
  j record;
begin
  for j in
    select * from (values
      ('drain-scheduled-notifications',           '* * * * *',    'send-push'),
      ('send-engagement-nudges-every-15-min',     '*/15 * * * *', 'send-engagement-nudges'),
      ('sync-app-builds-daily',                   '0 3 * * *',    'sync-app-builds'),
      ('send-content-notifications-every-minute', '* * * * *',    'send-content-notifications')
    ) as t(jobname, schedule, fn)
  loop
    -- Only touch jobs this database actually has; the two projects don't run
    -- an identical set.
    if not exists (select 1 from cron.job c where c.jobname = j.jobname) then
      continue;
    end if;

    perform cron.schedule(
      j.jobname,
      j.schedule,
      format(
        $cmd$
  select net.http_post(
    url     := public.project_url() || '/functions/v1/%s',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body    := '{}'::jsonb
  ) as request_id
  where public.project_url() is not null;
        $cmd$,
        j.fn
      )
    );
  end loop;
end $$;

-- Leaves a hardcoded ref impossible to miss in review. Any row here is a job
-- that will fire against the wrong project.
do $$
declare
  stragglers text;
begin
  select string_agg(jobname, ', ')
  into stragglers
  from cron.job
  where command ~ 'https://[a-z0-9]+\.supabase\.co';

  if stragglers is not null then
    raise warning 'cron jobs still targeting a hardcoded project: %', stragglers;
  end if;
end $$;
