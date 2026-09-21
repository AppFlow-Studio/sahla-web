-- Make the prayer cron jobs target the environment they actually run in.
-- ----------------------------------------------------------------------------
-- Every previous attempt hardcoded a project ref into the cron command, so one
-- environment was always wrong:
--   20260430000003 — read a GUC that was never set        → "unrecognized configuration parameter"
--   20260523200000 — hardcoded arlvxsoeecvfhkepalna (prod) → broken on staging
--   20260603180000 — hardcoded rpepxdgdiqeirdqsazuc (stg)  → broken on PROD
--
-- The last one reached production, so prod's crons have been POSTing into the
-- staging project: prod's `todays_prayers` was never refreshed (its newest row
-- was 2026-08-25) while the per-minute notification job double-fired staging's
-- sender. Worse, `cron.job_run_details` showed "succeeded" every run, because
-- net.http_post only reports that it *queued* the request — the HTTP status
-- lands asynchronously in net._http_response, which pg_net prunes after hours.
--
-- Fix: keep the target in a per-database row and resolve it at run time. The
-- same migration file then produces the correct URL in every environment.
--
-- The value is env-specific, so it is NOT seeded here. Each project needs one
-- insert (idempotent, safe to re-run):
--   insert into public.app_config (key, value)
--   values ('project_url', 'https://<this-project-ref>.supabase.co')
--   on conflict (key) do update set value = excluded.value, updated_at = now();

create table if not exists public.app_config (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

comment on table public.app_config is
  'Per-environment settings resolved at run time. Never seed env-specific values in a migration.';

-- No policies are defined, so with RLS on, only the service role and superuser
-- reach it. project_url() is security definer precisely so cron can still read.
alter table public.app_config enable row level security;

create or replace function public.project_url()
returns text
language sql
stable
security definer
set search_path = ''
as $fn$
  select value from public.app_config where key = 'project_url';
$fn$;

comment on function public.project_url() is
  'This project''s own Functions base URL. Returns NULL when unset, and the cron jobs below no-op rather than POSTing to a malformed URL.';

revoke all on function public.project_url() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Reschedule both prayer jobs against the resolved URL.
-- ---------------------------------------------------------------------------

select cron.unschedule('sync-prayer-times-biweekly')
where exists (select 1 from cron.job where jobname = 'sync-prayer-times-biweekly');

select cron.schedule(
  'sync-prayer-times-biweekly',
  '0 3 1,15 * *',
  $job$
  select net.http_post(
    url     := public.project_url() || '/functions/v1/sync-prayer-times',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body    := '{}'::jsonb
  ) as request_id
  where public.project_url() is not null;
  $job$
);

select cron.unschedule('send-prayer-notifications-every-minute')
where exists (select 1 from cron.job where jobname = 'send-prayer-notifications-every-minute');

select cron.schedule(
  'send-prayer-notifications-every-minute',
  '* * * * *',
  $job$
  select net.http_post(
    url     := public.project_url() || '/functions/v1/send-prayer-notifications',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body    := '{}'::jsonb
  ) as request_id
  where public.project_url() is not null;
  $job$
);
