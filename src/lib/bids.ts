import { polarClient, siteUrl } from "@/lib/polar";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

type PrepareResult = {
  action: "reuse" | "attach" | "created";
  bid_id: string;
  polar_checkout_id: string | null;
  polar_checkout_url: string | null;
  polar_checkout_expires_at?: string | null;
};

function asPrepare(data: unknown): PrepareResult {
  const row = data as PrepareResult;
  if (!row?.bid_id) {
    throw new Error("Could not reserve checkout.");
  }
  return row;
}

async function polarSessionStillOpen(checkoutId: string) {
  if (checkoutId.startsWith("lock:")) return false;
  try {
    const session = await polarClient().checkouts.get({ id: checkoutId });
    return session.status === "open" && Boolean(session.url);
  } catch {
    return false;
  }
}

async function attachPolarCheckout(bidId: string, amountDueCents: number) {
  const db = createSupabaseAdmin();

  const { data: claimed, error: claimError } = await db
    .from("bids")
    .update({ polar_checkout_id: `lock:${bidId}` })
    .eq("id", bidId)
    .is("polar_checkout_id", null)
    .select("id")
    .maybeSingle();

  if (claimError) {
    throw new Error(claimError.message);
  }

  if (!claimed) {
    const { data: existing, error: existingError } = await db
      .from("bids")
      .select("polar_checkout_url")
      .eq("id", bidId)
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);
    if (existing?.polar_checkout_url) return existing.polar_checkout_url as string;
    throw new Error("Checkout is already being created. Try again.");
  }

  const productId = process.env.POLAR_PRODUCT_ID!;
  try {
    const checkout = await polarClient().checkouts.create({
      products: [productId],
      prices: {
        [productId]: [
          {
            amountType: "fixed",
            priceAmount: amountDueCents,
            priceCurrency: "usd",
          },
        ],
      },
      successUrl: `${siteUrl()}/success?checkout_id={CHECKOUT_ID}`,
      returnUrl: siteUrl(),
      allowDiscountCodes: false,
      metadata: { bid_id: bidId },
    });

    const expiresAt =
      checkout.expiresAt instanceof Date
        ? checkout.expiresAt.toISOString()
        : checkout.expiresAt;

    const { data, error } = await db
      .from("bids")
      .update({
        polar_checkout_id: checkout.id,
        polar_checkout_url: checkout.url,
        polar_checkout_expires_at: expiresAt,
        status: "checkout_created",
      })
      .eq("id", bidId)
      .select("polar_checkout_url")
      .single();

    if (error || !data?.polar_checkout_url) {
      throw new Error(error?.message ?? "Checkout was created but could not be stored.");
    }

    return data.polar_checkout_url as string;
  } catch (error) {
    await db
      .from("bids")
      .update({ polar_checkout_id: null, status: "pending" })
      .eq("id", bidId)
      .like("polar_checkout_id", "lock:%");
    throw error;
  }
}

export async function createOrReuseCheckout(params: {
  normalizedUrl: string;
  displayUrl: string;
  hostname: string;
  name: string;
  pitch: string;
  logoUrl: string | null;
  targetBidCents: number;
  amountDueCents: number;
}) {
  const db = createSupabaseAdmin();
  const { data, error } = await db.rpc("prepare_checkout_bid", {
    p_normalized_url: params.normalizedUrl,
    p_display_url: params.displayUrl,
    p_hostname: params.hostname,
    p_name: params.name,
    p_pitch: params.pitch,
    p_logo_url: params.logoUrl,
    p_target_cents: params.targetBidCents,
    p_amount_due_cents: params.amountDueCents,
  });

  if (error) {
    if (error.code === "23505") {
      return createOrReuseCheckout(params);
    }
    throw new Error(error.message);
  }

  const slot = asPrepare(data);

  if (slot.action === "reuse" && slot.polar_checkout_id && slot.polar_checkout_url) {
    const open = await polarSessionStillOpen(slot.polar_checkout_id);
    if (open) {
      return slot.polar_checkout_url;
    }

    await db
      .from("bids")
      .update({ status: "expired" })
      .eq("id", slot.bid_id)
      .eq("status", "checkout_created");

    return createOrReuseCheckout(params);
  }

  return attachPolarCheckout(slot.bid_id, params.amountDueCents);
}
