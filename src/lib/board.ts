import { DEMO_LISTINGS } from "./demo-data";
import { rankListings } from "./rank";
import { hasSupabase, supabaseAdmin } from "./supabase";
import type { Listing, RankedListing, SiteStats } from "./types";

export function withRanks(listings: Listing[]): RankedListing[] {
  return rankListings(listings).map((listing, index) => ({
    ...listing,
    rank: index + 1,
  }));
}

export async function getBoard(): Promise<{
  listings: RankedListing[];
  stats: SiteStats;
  live: boolean;
}> {
  if (!hasSupabase()) {
    return {
      listings: withRanks(DEMO_LISTINGS),
      stats: {
        visitors: 18420,
        launched_at: "2026-08-01T00:00:00.000Z",
      },
      live: false,
    };
  }

  const db = supabaseAdmin();
  const [{ data: listings, error }, { data: stats }] = await Promise.all([
    db
      .from("listings")
      .select(
        "id, listing_key, url, name, tagline, category, logo_url, bid_cents, clicks, created_at, last_bid_at",
      )
      .order("bid_cents", { ascending: false })
      .order("last_bid_at", { ascending: true }),
    db.from("site_stats").select("visitors, launched_at").eq("id", 1).maybeSingle(),
  ]);

  if (error) {
    throw new Error(error.message);
  }

  return {
    listings: withRanks((listings ?? []) as Listing[]),
    stats: {
      visitors: stats?.visitors ?? 0,
      launched_at: stats?.launched_at ?? new Date().toISOString(),
    },
    live: true,
  };
}

export async function getListingById(id: string) {
  if (!hasSupabase()) {
    return DEMO_LISTINGS.find((l) => l.id === id) ?? null;
  }
  const { data, error } = await supabaseAdmin()
    .from("listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Listing | null) ?? null;
}

export async function recordClick(id: string) {
  if (!hasSupabase()) {
    const listing = DEMO_LISTINGS.find((l) => l.id === id);
    return listing?.url ?? null;
  }
  const { data, error } = await supabaseAdmin().rpc("record_click", {
    p_listing_id: id,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function bumpVisitor() {
  if (!hasSupabase()) return;
  await supabaseAdmin().rpc("bump_visitor");
}
