import { getAuthoritativeListings, getBoard } from "@/lib/board";
import { ListingUrlError, normalizeListingUrl } from "@/lib/listing-key";
import { quoteBid, rankForBid } from "@/lib/rank";
import { hasSupabaseAdmin } from "@/lib/supabase/env";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const amount = Number(searchParams.get("amount") ?? "0");
  const rawUrl = searchParams.get("url") ?? "";
  const dollars = Number.isFinite(amount) ? Math.floor(amount) : 0;

  const listings = hasSupabaseAdmin()
    ? await getAuthoritativeListings()
    : (await getBoard()).listings;

  if (!rawUrl) {
    return Response.json({
      rank: rankForBid(listings, Math.max(0, dollars) * 100),
    });
  }

  try {
    const { listingKey } = normalizeListingUrl(rawUrl);
    const quote = quoteBid(listings, listingKey, dollars);
    if (!quote.ok) {
      return Response.json({ error: quote.error, rank: null });
    }
    return Response.json({
      rank: quote.rank,
      pay: quote.incrementCents / 100,
      existing: quote.existing,
    });
  } catch (error) {
    if (error instanceof ListingUrlError) {
      return Response.json({ error: error.message, rank: null }, { status: 400 });
    }
    return Response.json({ error: "Could not quote that bid." }, { status: 400 });
  }
}
