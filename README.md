# SaaSRanks

A public pay-to-rank leaderboard for SaaS products — an [outbid.lol](https://outbid.lol) clone, scoped to software. Rank is the bid. Checkout is [Polar](https://polar.sh). Listings live in [Supabase](https://supabase.com).

## How it works

1. Someone enters a product URL and a dollar amount.
2. SaaSRanks quotes the rank that bid would take (`$5` minimum, `$5` extra to steal #1, `$1` raises).
3. Polar Checkout charges the increment with an ad-hoc fixed price.
4. The `order.paid` webhook writes the listing to Postgres. Equal bids keep the older listing higher.

## Setup

1. Create a Supabase project. Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor.
2. In Polar, create a **one-time** product named something like “SaaSRanks bid”. Copy the product ID.
3. Create a Polar access token (`checkouts:write`) and a webhook pointing at `https://your-domain.com/api/webhooks/polar`. Subscribe to `order.paid` (and `order.created` if you want a fallback).
4. Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
POLAR_ACCESS_TOKEN=
POLAR_WEBHOOK_SECRET=
POLAR_PRODUCT_ID=
POLAR_SERVER=sandbox
```

5. Install and run:

```bash
npm install
npm run dev
```

Without Polar/Supabase keys the homepage still renders a **demo board**. Checkout and live writes stay disabled until the env is complete.

Local Polar webhooks need a public tunnel (ngrok, Cloudflare Tunnel, Polar sandbox dashboard).

## Stack

- Next.js App Router
- Supabase (listings, pending bids, orders, click counts, visitors)
- Polar Checkout + webhooks (merchant of record)
