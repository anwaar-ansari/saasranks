export type Listing = {
  id: string;
  listing_key: string;
  url: string;
  name: string;
  tagline: string;
  category: string;
  logo_url: string | null;
  bid_cents: number;
  clicks: number;
  created_at: string;
  last_bid_at: string;
};

export type RankedListing = Listing & { rank: number };

export type ActivityEvent = {
  id: string;
  listingId: string;
  name: string;
  rank: number;
  kind: "entered" | "reclaimed";
  at: string;
};

export type TrendingItem = {
  listing: RankedListing;
  clicksPerHour: number;
};

export type SiteStats = {
  visitors: number;
  launched_at: string;
};
