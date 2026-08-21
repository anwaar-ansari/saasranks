import { z } from "zod";
import { getAuthoritativeListings } from "@/lib/board";
import { ListingUrlError, normalizeListingUrl } from "@/lib/listing-key";
import { MIN_BID_DOLLARS } from "@/lib/money";
import { fetchSitePreview } from "@/lib/og";
import { polarClient, polarConfigured, siteUrl } from "@/lib/polar";
import { quoteBid } from "@/lib/rank";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
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
    const name = preview.name.slice(0, 80);
    const pitch = (body.tagline?.trim() || preview.tagline).slice(0, 160);

    const db = createSupabaseAdmin();
    const { data: bid, error: bidError } = await db
      .from("bids")
      .insert({
        normalized_url: parsed.listingKey,
        display_url: parsed.url,
        hostname: parsed.host,
        name,
        pitch,
        logo_url: preview.logoUrl,
        requested_target_bid_cents: quote.targetBidCents,
        amount_due_cents: quote.incrementCents,
        status: "pending",
      })
      .select("id")
      .single();

    if (bidError || !bid) {
      return Response.json(
        { error: bidError?.message ?? "Could not create bid." },
        { status: 500 },
      );
    }

    const productId = process.env.POLAR_PRODUCT_ID!;
    const polar = polarClient();
    const checkout = await polar.checkouts.create({
      products: [productId],
      prices: {
        [productId]: [
          {
            amountType: "fixed",
            priceAmount: quote.incrementCents,
            priceCurrency: "usd",
          },
        ],
      },
      successUrl: `${siteUrl()}/success?checkout_id={CHECKOUT_ID}`,
      returnUrl: siteUrl(),
      allowDiscountCodes: false,
      metadata: {
        bid_id: bid.id,
      },
    });

    const { error: checkoutError } = await db
      .from("bids")
      .update({ polar_checkout_id: checkout.id })
      .eq("id", bid.id);

    if (checkoutError) {
      return Response.json({ error: checkoutError.message }, { status: 500 });
    }

    return Response.json({ url: checkout.url });
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
