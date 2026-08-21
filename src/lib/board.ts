import { DEMO_LISTINGS } from "./demo-data";
import { rankListings } from "./rank";
import { allowDemoBoard, hasSupabaseAdmin } from "./supabase/env";
import { createSupabaseAdmin } from "./supabase/admin";
import type {
  ActivityEvent,
  Listing,
  RankedListing,
  SiteStats,
  TrendingItem,
} from "./types";

type ListingRow = {
  id: string;
  normalized_url: string;
  display_url: string;
  hostname: string;
  name: string;
  pitch: string;
  logo_url: string | null;
  current_bid_cents: number;
  click_count: number;
  created_at: string;
  updated_at: string;
};

export function mapListing(row: ListingRow): Listing {
  return {
    id: row.id,
    listing_key: row.normalized_url,
    url: row.display_url,
    name: row.name,
    tagline: row.pitch,
    category: "other",
    logo_url: row.logo_url,
    bid_cents: row.current_bid_cents,
    clicks: row.click_count,
    created_at: row.created_at,
    last_bid_at: row.updated_at,
  };
}

export function withRanks(listings: Listing[]): RankedListing[] {
  return rankListings(listings).map((listing, index) => ({
    ...listing,
    rank: index + 1,
  }));
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
  estimateWhenEmpty: boolean,
): TrendingItem[] {
  return listings
    .map((listing) => {
      const counted = hourly.get(listing.id);
      const clicksPerHour =
        counted ??
        (estimateWhenEmpty ? Math.max(0, Math.round(listing.clicks / 5)) : 0);
      return { listing, clicksPerHour };
    })
    .sort((a, b) => {
      if (b.clicksPerHour !== a.clicksPerHour) {
        return b.clicksPerHour - a.clicksPerHour;
      }
      return b.listing.clicks - a.listing.clicks;
    })
    .slice(0, 5);
}

const emptyBoard = {
  listings: [] as RankedListing[],
  stats: {
    visitors: 0,
    launched_at: new Date().toISOString(),
  },
  live: false,
  activity: [] as ActivityEvent[],
  trending: [] as TrendingItem[],
};

export async function getBoard(): Promise<{
  listings: RankedListing[];
  stats: SiteStats;
  live: boolean;
  activity: ActivityEvent[];
  trending: TrendingItem[];
}> {
  if (!hasSupabaseAdmin()) {
    if (allowDemoBoard()) {
      const listings = withRanks(DEMO_LISTINGS);
      return {
        listings,
        stats: {
          visitors: 0,
          launched_at: new Date().toISOString(),
        },
        live: false,
        activity: activityFromListings(listings),
        trending: trendingFromClicks(listings, new Map(), true),
      };
    }
    console.error("Supabase is not configured; returning an empty leaderboard.");
    return emptyBoard;
  }

  const db = createSupabaseAdmin();
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const [{ data: rows, error }, { data: stats }, { data: recentClicks }] =
    await Promise.all([
      db
        .from("listings")
        .select(
          "id, normalized_url, display_url, hostname, name, pitch, logo_url, current_bid_cents, click_count, created_at, updated_at",
        )
        .order("current_bid_cents", { ascending: false })
        .order("created_at", { ascending: true }),
      db.from("site_stats").select("visitors, launched_at").eq("id", 1).maybeSingle(),
      db.from("clicks").select("listing_id").gte("created_at", hourAgo),
    ]);

  if (error) {
    throw new Error(error.message);
  }

  const ranked = withRanks((rows ?? []).map((row) => mapListing(row as ListingRow)));
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
    trending: trendingFromClicks(ranked, hourly, false),
  };
}

export async function getAuthoritativeListings(): Promise<Listing[]> {
  if (!hasSupabaseAdmin()) {
    throw new Error("Supabase is not configured.");
  }
  const { data, error } = await createSupabaseAdmin()
    .from("listings")
    .select(
      "id, normalized_url, display_url, hostname, name, pitch, logo_url, current_bid_cents, click_count, created_at, updated_at",
    );
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapListing(row as ListingRow));
}

export async function recordClick(id: string) {
  if (!hasSupabaseAdmin()) {
    if (allowDemoBoard()) {
      return DEMO_LISTINGS.find((l) => l.id === id)?.url ?? null;
    }
    return null;
  }
  const { data, error } = await createSupabaseAdmin().rpc("record_click", {
    p_listing_id: id,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function bumpVisitor() {
  if (!hasSupabaseAdmin()) return;
  await createSupabaseAdmin().rpc("bump_visitor");
}
