import { z } from "zod";
import { createOrReuseCheckout } from "@/lib/bids";
import { getAuthoritativeListings } from "@/lib/board";
import { ListingUrlError, normalizeListingUrl } from "@/lib/listing-key";
import { MIN_BID_DOLLARS } from "@/lib/money";
import { fetchSitePreview } from "@/lib/og";
import { polarConfigured } from "@/lib/polar";
import { quoteBid } from "@/lib/rank";
import { hasSupabaseAdmin } from "@/lib/supabase/env";

export const runtime = "nodejs";

const Body = z.object({
  url: z.string().min(1),
  amount: z.number().int().positive(),
  tagline: z.string().max(160).optional(),
});

export async function POST(request: Request) {
  try {
    if (!polarConfigured()) {
      return Response.json(
        {
          error:
            "Polar is not configured. Add POLAR_ACCESS_TOKEN and POLAR_PRODUCT_ID.",
        },
        { status: 503 },
      );
    }
    if (!hasSupabaseAdmin()) {
      return Response.json(
        {
          error:
            "Supabase is not configured. Run supabase/schema.sql and add project keys.",
        },
        { status: 503 },
      );
    }

    const body = Body.parse(await request.json());
    if (!Number.isInteger(body.amount) || body.amount < MIN_BID_DOLLARS) {
      return Response.json(
        { error: `Bids are whole US dollars, starting at $${MIN_BID_DOLLARS}.` },
        { status: 400 },
      );
    }

    const parsed = normalizeListingUrl(body.url);
    const listings = await getAuthoritativeListings();
    const quote = quoteBid(listings, parsed.listingKey, body.amount);

    if (!quote.ok) {
      return Response.json({ error: quote.error }, { status: 400 });
    }

    const preview = await fetchSitePreview(parsed.url);
    const checkoutUrl = await createOrReuseCheckout({
      normalizedUrl: parsed.listingKey,
      displayUrl: parsed.url,
      hostname: parsed.host,
      name: preview.name.slice(0, 80),
      pitch: (body.tagline?.trim() || preview.tagline).slice(0, 160),
      logoUrl: preview.logoUrl,
      targetBidCents: quote.targetBidCents,
      amountDueCents: quote.incrementCents,
    });

    return Response.json({ url: checkoutUrl });
  } catch (error) {
    if (error instanceof ListingUrlError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Check the bid form and try again." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Checkout failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
