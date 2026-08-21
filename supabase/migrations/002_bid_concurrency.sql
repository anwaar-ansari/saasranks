-- Applied on top of the previous schema.sql (before concurrency indexes).
-- Fresh installs should run supabase/schema.sql instead.

alter table public.bids drop constraint if exists bids_status_check;
alter table public.bids
  add constraint bids_status_check
  check (status in (
    'pending',
    'checkout_created',
    'paid',
    'processed',
    'failed',
    'expired',
    'cancelled'
  ));

alter table public.bids add column if not exists polar_checkout_url text;
alter table public.bids add column if not exists polar_checkout_expires_at timestamptz;

create unique index if not exists bids_one_open_checkout_per_url
  on public.bids (normalized_url)
  where status in ('pending', 'checkout_created');

create index if not exists bids_open_by_url_idx
  on public.bids (normalized_url, created_at desc)
  where status in ('pending', 'checkout_created');
