import { z } from "zod";
import { getBoard } from "@/lib/board";
import { ListingUrlError, normalizeListingUrl } from "@/lib/listing-key";
import { CATEGORY_VALUES } from "@/lib/categories";
import { fetchSitePreview } from "@/lib/og";
import { polarClient, polarConfigured, siteUrl } from "@/lib/polar";
import { quoteBid } from "@/lib/rank";
import { hasSupabase, supabaseAdmin } from "@/lib/supabase";
import { centsToDollars } from "@/lib/money";

export const runtime = "nodejs";

const Body = z.object({
  url: z.string().min(1),
  amount: z.number().int().positive(),
  tagline: z.string().max(160).optional(),
  name: z.string().max(80).optional(),
  category: z.enum(CATEGORY_VALUES),
});

export async function POST(request: Request) {
  try {
    if (!polarConfigured()) {
      return Response.json(
        {
          error:
            "Polar is not configured. Add POLAR_ACCESS_TOKEN and POLAR_PRODUCT_ID, then create a one-time product in Polar.",
        },
        { status: 503 },
      );
    }
    if (!hasSupabase()) {
      return Response.json(
        {
          error:
            "Supabase is not configured. Run supabase/schema.sql and add your project keys.",
        },
        { status: 503 },
      );
    }

    const json = await request.json();
    const body = Body.parse(json);
    const { listingKey, url } = normalizeListingUrl(body.url);
    const { listings } = await getBoard();
    const quote = quoteBid(listings, listingKey, body.amount);

    if (!quote.ok) {
      return Response.json({ error: quote.error }, { status: 400 });
    }

    const preview = await fetchSitePreview(url);
    const name = (body.name?.trim() || preview.name).slice(0, 80);
    const tagline = (body.tagline?.trim() || preview.tagline).slice(0, 160);

    const db = supabaseAdmin();
    const { data: pending, error: pendingError } = await db
      .from("pending_bids")
      .insert({
        listing_key: listingKey,
        url,
        name,
        tagline,
        category: body.category,
        logo_url: preview.logoUrl,
        target_bid_cents: quote.targetBidCents,
        increment_cents: quote.incrementCents,
        status: "pending",
      })
      .select("id")
      .single();

    if (pendingError || !pending) {
      return Response.json(
        { error: pendingError?.message ?? "Could not create bid." },
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
        pending_bid_id: pending.id,
        listing_key: listingKey,
        target_bid_cents: quote.targetBidCents,
        increment_cents: quote.incrementCents,
      },
    });

    await db
      .from("pending_bids")
      .update({ polar_checkout_id: checkout.id })
      .eq("id", pending.id);

    return Response.json({
      url: checkout.url,
      rank: quote.rank,
      pay: centsToDollars(quote.incrementCents),
    });
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
