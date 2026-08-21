import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { getBoard } from "@/lib/board";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Bid received — saasranks",
};

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout_id?: string }>;
}) {
  const { checkout_id } = await searchParams;
  const { stats } = await getBoard();

  return (
    <>
      <SiteHeader visitors={stats.visitors} />
      <main className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="text-[13px] font-semibold text-blue">Paid</p>
        <h1 className="mt-3 text-[36px] font-semibold tracking-tight">You&apos;re on the board.</h1>
        <p className="mt-3 text-[15px] text-dim">
          Polar confirmed the payment. That sets this product&apos;s bid to the
          amount you paid toward — it does not reserve a rank. The listing
          appears as soon as the webhook lands, then the live board orders by
          bid, oldest listing first on ties.
        </p>
        {checkout_id ? (
          <p className="mt-3 font-mono text-[12px] text-faint">Checkout {checkout_id}</p>
        ) : null}
        <Link
          href="/"
          className="mt-8 inline-flex rounded-xl bg-blue px-5 py-3 text-[14px] font-semibold text-white shadow-glow hover:bg-blue-hi"
        >
          Back to the board
        </Link>
      </main>
    </>
  );
}
