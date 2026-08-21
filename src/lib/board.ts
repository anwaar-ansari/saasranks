import { DEMO_LISTINGS } from "./demo-data";
import { rankListings } from "./rank";
import { hasSupabase, supabaseAdmin } from "./supabase";
import type {
  ActivityEvent,
  Listing,
  RankedListing,
  SiteStats,
  TrendingItem,
} from "./types";

const DEMO_BID_MINUTES = [8, 33, 46, 60, 95, 140, 200, 360];

export function withRanks(listings: Listing[]): RankedListing[] {
  return rankListings(listings).map((listing, index) => ({
    ...listing,
    rank: index + 1,
  }));
}

function demoListings(): RankedListing[] {
  const now = Date.now();
  return withRanks(
    DEMO_LISTINGS.map((listing, index) => ({
      ...listing,
      last_bid_at: new Date(
        now - (DEMO_BID_MINUTES[index] ?? 400) * 60_000,
      ).toISOString(),
    })),
  );
}

export function activityFromListings(listings: RankedListing[]): ActivityEvent[] {
  return [...listings]
    .sort(
      (a, b) =>
        new Date(b.last_bid_at).getTime() - new Date(a.last_bid_at).getTime(),
    )
    .slice(0, 8)
    .map((listing) => {
      const created = new Date(listing.created_at).getTime();
      const bid = new Date(listing.last_bid_at).getTime();
      const reclaimed = listing.rank === 1 && bid - created > 60 * 60 * 1000;
      return {
        id: `${listing.id}-${listing.last_bid_at}`,
        listingId: listing.id,
        name: listing.name,
        rank: listing.rank,
        kind: reclaimed ? ("reclaimed" as const) : ("entered" as const),
        at: listing.last_bid_at,
      };
    });
}

function trendingFromClicks(
  listings: RankedListing[],
  hourly: Map<string, number>,
): TrendingItem[] {
  return listings
    .map((listing) => ({
      listing,
      clicksPerHour:
        hourly.get(listing.id) ?? Math.max(1, Math.round(listing.clicks / 5)),
    }))
    .sort((a, b) => b.clicksPerHour - a.clicksPerHour)
    .slice(0, 5);
}

export async function getBoard(): Promise<{
  listings: RankedListing[];
  stats: SiteStats;
  live: boolean;
  activity: ActivityEvent[];
  trending: TrendingItem[];
}> {
  if (!hasSupabase()) {
    const listings = demoListings();
    return {
      listings,
      stats: {
        visitors: 18420,
        launched_at: "2026-08-01T00:00:00.000Z",
      },
      live: false,
      activity: activityFromListings(listings),
      trending: trendingFromClicks(listings, new Map()),
    };
  }

  const db = supabaseAdmin();
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const [{ data: listings, error }, { data: stats }, { data: recentClicks }] =
    await Promise.all([
      db
        .from("listings")
        .select(
          "id, listing_key, url, name, tagline, category, logo_url, bid_cents, clicks, created_at, last_bid_at",
        )
        .order("bid_cents", { ascending: false })
        .order("last_bid_at", { ascending: true }),
      db.from("site_stats").select("visitors, launched_at").eq("id", 1).maybeSingle(),
      db.from("clicks").select("listing_id").gte("created_at", hourAgo),
    ]);

  if (error) {
    throw new Error(error.message);
  }

  const ranked = withRanks((listings ?? []) as Listing[]);
  const hourly = new Map<string, number>();
  for (const row of recentClicks ?? []) {
    const id = (row as { listing_id: string }).listing_id;
    hourly.set(id, (hourly.get(id) ?? 0) + 1);
  }

  return {
    listings: ranked,
    stats: {
      visitors: stats?.visitors ?? 0,
      launched_at: stats?.launched_at ?? new Date().toISOString(),
    },
    live: true,
    activity: activityFromListings(ranked),
    trending: trendingFromClicks(ranked, hourly),
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
