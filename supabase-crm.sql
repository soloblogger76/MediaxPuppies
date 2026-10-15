-- Media Puppies — CRM columns for /admin/.
-- Purely additive: no DROP, no data change, safe to run on the live table.
-- Run once in Supabase → SQL Editor → New query → Run, then hit Refresh in /admin/.

alter table public.leads add column if not exists follow_up_at timestamptz;
alter table public.leads add column if not exists last_contacted_at timestamptz;
alter table public.leads add column if not exists priority     text not null default 'normal'
  check (priority in ('low','normal','high'));
alter table public.leads add column if not exists tags         text[] not null default '{}';
alter table public.leads add column if not exists activity     jsonb  not null default '[]'::jsonb;

create index if not exists leads_follow_up_idx on public.leads (follow_up_at)
  where follow_up_at is not null;

-- The existing update policy ("only signed-in users can update leads")
-- already covers these columns. Nothing else to change.
