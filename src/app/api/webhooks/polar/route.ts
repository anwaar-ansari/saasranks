import { Webhooks } from "@polar-sh/nextjs";
import { hasSupabase, supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

async function applyOrder(order: {
  id: string;
  paid: boolean;
  status: string;
  netAmount: number;
  metadata?: Record<string, string | number | boolean>;
}) {
  if (!hasSupabase()) return;
  if (!order.paid && order.status !== "paid") return;

  const pendingId = String(order.metadata?.pending_bid_id ?? "");
  if (!pendingId) {
    console.error("Paid Polar order missing pending_bid_id metadata", order.id);
    return;
  }

  const { error } = await supabaseAdmin().rpc("apply_paid_bid", {
    p_pending_id: pendingId,
    p_polar_order_id: order.id,
    p_amount_cents: order.netAmount,
  });

  if (error) {
    console.error("apply_paid_bid failed", error);
    throw error;
  }
}

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET ?? "missing",
  onOrderPaid: async (payload) => {
    await applyOrder(
      payload.data as {
        id: string;
        paid: boolean;
        status: string;
        netAmount: number;
        metadata?: Record<string, string | number | boolean>;
      },
    );
  },
});
