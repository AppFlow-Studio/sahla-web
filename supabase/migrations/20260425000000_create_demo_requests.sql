create table public.demo_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  mosque_name text not null,
  city text,
  country text,
  notes text,
  created_at timestamptz not null default now()
);

-- RLS: only service role can insert (from the API route)
alter table public.demo_requests enable row level security;
