-- SaaSRanks production schema.
-- Run this once in the Supabase SQL editor (Dashboard → SQL).
-- Replaces the earlier demo schema if it exists.

create extension if not exists pgcrypto;

drop function if exists public.apply_paid_bid(uuid, text, integer);
drop function if exists public.record_click(uuid);
drop function if exists public.bump_visitor();

drop table if exists public.orders cascade;
drop table if exists public.pending_bids cascade;
drop table if exists public.clicks cascade;
drop table if exists public.listings cascade;
drop table if exists public.bids cascade;
drop table if exists public.site_stats cascade;

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  normalized_url text not null unique,
  display_url text not null,
  hostname text not null,
  name text not null,
  pitch text not null default '',
  logo_url text,
  current_bid_cents integer not null check (current_bid_cents > 0),
  total_paid_cents integer not null default 0 check (total_paid_cents >= 0),
  click_count integer not null default 0 check (click_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index listings_rank_idx
  on public.listings (current_bid_cents desc, created_at asc);

create table public.bids (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings (id) on delete set null,
  normalized_url text not null,
  display_url text not null,
  hostname text not null,
  name text not null default '',
  pitch text not null default '',
  logo_url text,
  requested_target_bid_cents integer not null check (requested_target_bid_cents > 0),
  amount_due_cents integer not null check (amount_due_cents > 0),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'processed', 'failed', 'expired')),
  polar_checkout_id text unique,
  polar_order_id text unique,
  webhook_processed_at timestamptz,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index bids_status_idx on public.bids (status, created_at desc);
create index bids_normalized_url_idx on public.bids (normalized_url);

create table public.clicks (
  id bigint generated always as identity primary key,
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index clicks_listing_created_idx on public.clicks (listing_id, created_at desc);

create table public.site_stats (
  id integer primary key default 1 check (id = 1),
  visitors bigint not null default 0,
  launched_at timestamptz not null default now()
);

insert into public.site_stats (id, visitors) values (1, 0);

alter table public.listings enable row level security;
alter table public.bids enable row level security;
alter table public.clicks enable row level security;
alter table public.site_stats enable row level security;

create policy listings_public_read
  on public.listings for select
  to anon, authenticated
  using (true);

create policy stats_public_read
  on public.site_stats for select
  to anon, authenticated
  using (true);

-- Anonymous clients cannot insert/update listings, bids, or clicks.
-- All writes go through the service-role admin client / SECURITY DEFINER RPCs.

create or replace function public.apply_paid_bid(
  p_polar_checkout_id text,
  p_polar_order_id text,
  p_paid_subtotal_cents integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bid public.bids%rowtype;
  v_listing public.listings%rowtype;
  v_listing_id uuid;
begin
  if p_polar_checkout_id is null or p_polar_order_id is null then
    raise exception 'checkout and order ids are required';
  end if;

  if exists (
    select 1 from public.bids
    where polar_order_id = p_polar_order_id
      and status = 'processed'
  ) then
    return jsonb_build_object('applied', false, 'reason', 'already_processed');
  end if;

  select * into v_bid
  from public.bids
  where polar_checkout_id = p_polar_checkout_id
  for update;

  if not found then
    raise exception 'pending bid not found for checkout';
  end if;

  if v_bid.status = 'processed' then
    return jsonb_build_object('applied', false, 'reason', 'already_processed');
  end if;

  if v_bid.amount_due_cents is distinct from p_paid_subtotal_cents then
    update public.bids
    set status = 'failed'
    where id = v_bid.id;
    raise exception 'paid amount does not match amount due';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_bid.normalized_url));

  select * into v_listing
  from public.listings
  where normalized_url = v_bid.normalized_url
  for update;

  if not found then
    insert into public.listings (
      normalized_url,
      display_url,
      hostname,
      name,
      pitch,
      logo_url,
      current_bid_cents,
      total_paid_cents,
      updated_at
    )
    values (
      v_bid.normalized_url,
      v_bid.display_url,
      v_bid.hostname,
      v_bid.name,
      v_bid.pitch,
      v_bid.logo_url,
      v_bid.requested_target_bid_cents,
      v_bid.amount_due_cents,
      now()
    )
    returning id into v_listing_id;
  else
    update public.listings
    set
      display_url = v_bid.display_url,
      hostname = v_bid.hostname,
      name = case when v_bid.name <> '' then v_bid.name else public.listings.name end,
      pitch = case when v_bid.pitch <> '' then v_bid.pitch else public.listings.pitch end,
      logo_url = coalesce(v_bid.logo_url, public.listings.logo_url),
      current_bid_cents = greatest(
        public.listings.current_bid_cents,
        v_bid.requested_target_bid_cents
      ),
      total_paid_cents = public.listings.total_paid_cents + v_bid.amount_due_cents,
      updated_at = now()
    where id = v_listing.id;

    v_listing_id := v_listing.id;
  end if;

  update public.bids
  set
    status = 'processed',
    listing_id = v_listing_id,
    polar_order_id = p_polar_order_id,
    paid_at = now(),
    webhook_processed_at = now()
  where id = v_bid.id;

  return jsonb_build_object(
    'applied', true,
    'listing_id', v_listing_id,
    'bid_id', v_bid.id
  );
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
  if p_listing_id is null then
    raise exception 'listing not found';
  end if;

  update public.listings
  set click_count = click_count + 1
  where id = p_listing_id
  returning display_url into dest;

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
  return coalesce(total, 0);
end;
$$;

revoke all on function public.apply_paid_bid(text, text, integer) from public, anon, authenticated;
revoke all on function public.record_click(uuid) from public, anon, authenticated;
revoke all on function public.bump_visitor() from public, anon, authenticated;

grant execute on function public.apply_paid_bid(text, text, integer) to service_role;
grant execute on function public.record_click(uuid) to service_role;
grant execute on function public.bump_visitor() to service_role;
