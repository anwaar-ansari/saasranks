import Link from "next/link";

export const metadata = {
  title: "Bid received · SaaSRanks",
};

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout_id?: string }>;
}) {
  const { checkout_id } = await searchParams;

  return (
    <main className="mx-auto max-w-xl px-5 py-20 text-center">
      <p className="text-xs uppercase tracking-[0.22em] text-lime">Paid</p>
      <h1 className="mt-4 font-serif text-5xl tracking-tight">You’re on the board.</h1>
      <p className="mt-4 text-cream-dim">
        Polar confirmed the payment. The listing appears as soon as the webhook
        lands — usually a few seconds.
      </p>
      {checkout_id ? (
        <p className="mt-3 font-mono text-xs text-cream-dim">
          Checkout {checkout_id}
        </p>
      ) : null}
      <Link
        href="/"
        className="mt-8 inline-flex h-12 items-center rounded-xl bg-lime px-5 font-medium text-lime-ink"
      >
        Back to the board
      </Link>
    </main>
  );
}
