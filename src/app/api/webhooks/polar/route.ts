import { Webhooks } from "@polar-sh/nextjs";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { hasSupabaseAdmin } from "@/lib/supabase/env";

export const runtime = "nodejs";

async function applyPaidOrder(order: {
  id: string;
  paid: boolean;
  checkoutId: string | null;
  subtotalAmount: number;
}) {
  if (!hasSupabaseAdmin()) {
    throw new Error("Supabase is not configured.");
  }
  if (!order.paid) return;
  if (!order.checkoutId) {
    throw new Error("Paid order is missing checkout id.");
  }

  const { data, error } = await createSupabaseAdmin().rpc("apply_paid_bid", {
    p_polar_checkout_id: order.checkoutId,
    p_polar_order_id: order.id,
    p_paid_subtotal_cents: order.subtotalAmount,
  });

  if (error) {
    console.error("apply_paid_bid failed", error);
    throw error;
  }

  const result = data as { applied?: boolean; reason?: string } | null;
  if (result && result.applied === false) {
    console.warn("Polar order not applied", {
      orderId: order.id,
      checkoutId: order.checkoutId,
      reason: result.reason,
    });
  }

  return data;
}

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET ?? "missing",
  onOrderPaid: async (payload) => {
    const order = payload.data as {
      id: string;
      paid: boolean;
      checkoutId: string | null;
      subtotalAmount: number;
    };
    await applyPaidOrder(order);
  },
});
