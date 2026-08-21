-- SaaSRanks schema. Run in the Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  listing_key text not null unique,
  url text not null,
  name text not null,
  tagline text not null default '',
  category text not null default 'other',
  logo_url text,
  bid_cents integer not null check (bid_cents >= 0),
  clicks integer not null default 0,
  created_at timestamptz not null default now(),
  last_bid_at timestamptz not null default now()
);

create index if not exists listings_rank_idx
  on public.listings (bid_cents desc, last_bid_at asc, created_at asc);

create table if not exists public.pending_bids (
  id uuid primary key default gen_random_uuid(),
  listing_key text not null,
  url text not null,
  name text not null,
  tagline text not null default '',
  category text not null default 'other',
  logo_url text,
  target_bid_cents integer not null,
  increment_cents integer not null,
  polar_checkout_id text unique,
  status text not null default 'pending' check (status in ('pending', 'paid', 'expired')),
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  polar_order_id text not null unique,
  pending_bid_id uuid references public.pending_bids (id),
  amount_cents integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.clicks (
  id bigint generated always as identity primary key,
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.site_stats (
  id integer primary key default 1 check (id = 1),
  visitors bigint not null default 0,
  launched_at timestamptz not null default now()
);

insert into public.site_stats (id, visitors)
values (1, 0)
on conflict (id) do nothing;

alter table public.listings enable row level security;
alter table public.pending_bids enable row level security;
alter table public.orders enable row level security;
alter table public.clicks enable row level security;
alter table public.site_stats enable row level security;

drop policy if exists listings_public_read on public.listings;
create policy listings_public_read
  on public.listings for select
  using (true);

drop policy if exists stats_public_read on public.site_stats;
create policy stats_public_read
  on public.site_stats for select
  using (true);

create or replace function public.apply_paid_bid(
  p_pending_id uuid,
  p_polar_order_id text,
  p_amount_cents integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  bid public.pending_bids%rowtype;
begin
  if exists (select 1 from public.orders where polar_order_id = p_polar_order_id) then
    return;
  end if;

  select * into bid from public.pending_bids where id = p_pending_id;
  if not found then
    raise exception 'pending bid not found';
  end if;

  insert into public.orders (polar_order_id, pending_bid_id, amount_cents)
  values (p_polar_order_id, p_pending_id, p_amount_cents);

  update public.pending_bids
  set status = 'paid'
  where id = p_pending_id;

  insert into public.listings (
    listing_key, url, name, tagline, category, logo_url, bid_cents, last_bid_at
  )
  values (
    bid.listing_key,
    bid.url,
    bid.name,
    bid.tagline,
    bid.category,
    bid.logo_url,
    bid.target_bid_cents,
    now()
  )
  on conflict (listing_key) do update set
    url = excluded.url,
    name = excluded.name,
    tagline = excluded.tagline,
    category = excluded.category,
    logo_url = coalesce(excluded.logo_url, public.listings.logo_url),
    bid_cents = greatest(public.listings.bid_cents, excluded.bid_cents),
    last_bid_at = now();
end;
$$;

create or replace function public.record_click(p_listing_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  dest text;
begin
  update public.listings
  set clicks = clicks + 1
  where id = p_listing_id
  returning url into dest;

  if dest is null then
    raise exception 'listing not found';
  end if;

  insert into public.clicks (listing_id) values (p_listing_id);
  return dest;
end;
$$;

create or replace function public.bump_visitor()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  total bigint;
begin
  update public.site_stats
  set visitors = visitors + 1
  where id = 1
  returning visitors into total;
  return total;
end;
$$;
