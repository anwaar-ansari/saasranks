import { getBoard } from "@/lib/board";
import { formatCompact, formatUsd } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Stats · SaaSRanks",
};

export default async function StatsPage() {
  const { listings, stats, live } = await getBoard();
  const volume = listings.reduce((sum, l) => sum + l.bid_cents, 0);
  const clicks = listings.reduce((sum, l) => sum + l.clicks, 0);

  return (
    <main className="mx-auto max-w-3xl px-5 py-14">
      <p className="text-xs uppercase tracking-[0.22em] text-cream-dim">Stats</p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">The board, counted.</h1>
      <p className="mt-4 text-cream-dim">
        {live
          ? "Live totals from Supabase."
          : "Demo totals until Supabase is connected."}
      </p>

      <dl className="mt-10 grid gap-4 sm:grid-cols-2">
        {[
          { label: "Visitors", value: formatCompact(stats.visitors) },
          { label: "Listings", value: formatCompact(listings.length) },
          { label: "Bid volume on the board", value: formatUsd(volume) },
          { label: "Tracked clicks", value: formatCompact(clicks) },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-line bg-ink-2 p-5">
            <dt className="text-sm text-cream-dim">{item.label}</dt>
            <dd className="mt-2 font-serif text-4xl tabular">{item.value}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
