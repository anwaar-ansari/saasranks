# SaaSRanks

A public pay-to-rank leaderboard for SaaS products. Rank is the bid. Checkout is [Polar](https://polar.sh). Listings live in [Supabase](https://supabase.com).

## Ranking

- Empty board: first listing can enter at **$1**.
- To stand above another listing, bid at least **$1 more** than its current bid.
- Equal bids keep the **older** listing higher (`current_bid_cents DESC`, `created_at ASC`).
- Raising an existing URL charges only the **difference**.
- Checkout buys a **target bid total**, not a reserved rank. One unpaid Polar session is allowed per SaaS URL.

## Setup

1. Create a Supabase project. Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor.
2. In Polar, create a **one-time** product (for example “SaaSRanks bid”). Copy the product ID.
3. Create a Polar access token with `checkouts:write`.
4. Add a webhook to `/api/webhooks/polar` and subscribe to **`order.paid`**.
5. Copy `.env.example` to `.env.local` and fill in the values.

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
POLAR_ACCESS_TOKEN=
POLAR_WEBHOOK_SECRET=
POLAR_PRODUCT_ID=
POLAR_SERVER=sandbox
```

```bash
npm install
npm run dev
```

Local Polar webhooks need a public tunnel (ngrok or Cloudflare Tunnel) pointed at `/api/webhooks/polar`.

In production, missing Supabase config yields an **empty** board — demo listings are local-only (`NODE_ENV !== "production"`).

## Stack

- Next.js App Router
- Supabase Postgres + RLS
- Polar Checkout + `order.paid` webhooks
