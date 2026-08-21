import {
  MIN_BID_DOLLARS,
  STEP_DOLLARS,
  TOP_PREMIUM_DOLLARS,
  dollarsToCents,
} from "./money";
import type { Listing } from "./types";

export function rankListings(listings: Listing[]) {
  return [...listings].sort((a, b) => {
    if (b.bid_cents !== a.bid_cents) return b.bid_cents - a.bid_cents;
    const aTime = new Date(a.last_bid_at).getTime();
    const bTime = new Date(b.last_bid_at).getTime();
    if (aTime !== bTime) return aTime - bTime;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

export function rankForBid(listings: Listing[], bidCents: number, listingKey?: string) {
  const others = listingKey
    ? listings.filter((l) => l.listing_key !== listingKey)
    : listings;
  const ahead = others.filter((l) => l.bid_cents > bidCents).length;
  return ahead + 1;
}

export function minNewListingCents() {
  return dollarsToCents(MIN_BID_DOLLARS);
}

export function minTakeTopCents(listings: Listing[]) {
  const top = rankListings(listings)[0];
  if (!top) return minNewListingCents();
  return top.bid_cents + dollarsToCents(TOP_PREMIUM_DOLLARS);
}

export function quoteBid(listings: Listing[], listingKey: string, targetDollars: number) {
  const target = dollarsToCents(Math.floor(targetDollars));
  const existing = listings.find((l) => l.listing_key === listingKey);
  const ranked = rankListings(listings);
  const top = ranked[0];

  if (existing) {
    const minRaise = existing.bid_cents + dollarsToCents(STEP_DOLLARS);
    if (target < minRaise) {
      return {
        ok: false as const,
        error: `Raise this listing by at least $1. Minimum new bid is $${minRaise / 100}.`,
      };
    }
    return {
      ok: true as const,
      targetBidCents: target,
      incrementCents: target - existing.bid_cents,
      rank: rankForBid(listings, target, listingKey),
      existing: true,
    };
  }

  if (target < minNewListingCents()) {
    return {
      ok: false as const,
      error: `New spots start at $${MIN_BID_DOLLARS}.`,
    };
  }

  const wantsTop = top && target > top.bid_cents;
  if (wantsTop && target < minTakeTopCents(listings)) {
    return {
      ok: false as const,
      error: `Taking #1 costs at least $${TOP_PREMIUM_DOLLARS} more than the current top bid.`,
    };
  }

  return {
    ok: true as const,
    targetBidCents: target,
    incrementCents: target,
    rank: rankForBid(listings, target),
    existing: false,
  };
}
