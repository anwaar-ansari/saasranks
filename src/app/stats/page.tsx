import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { getBoard } from "@/lib/board";
import { formatCompact, formatUsd } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Stats — saasranks",
};

export default async function StatsPage() {
  const { listings, stats, live } = await getBoard();
  const volume = listings.reduce((sum, l) => sum + l.bid_cents, 0);
  const clicks = listings.reduce((sum, l) => sum + l.clicks, 0);

  return (
    <>
      <SiteHeader visitors={stats.visitors} />
      <main className="mx-auto max-w-[720px] px-4 py-10 sm:px-6 sm:py-14">
        <Link href="/" className="text-[13px] font-medium text-blue hover:text-blue-hi">
          ← Back to the board
        </Link>
        <p className="mt-8 text-[13px] text-faint">Stats — saasranks</p>
        <h1 className="mt-2 text-[36px] font-semibold tracking-tight">Stats</h1>
        <p className="mt-3 text-[15px] text-dim">
          {live ? "Live totals from Supabase." : "Demo totals until Supabase is connected."}
        </p>
        <dl className="mt-8 grid gap-3 sm:grid-cols-2">
          {[
            { label: "Visitors", value: formatCompact(stats.visitors) },
            { label: "Listings", value: formatCompact(listings.length) },
            { label: "Bid volume", value: formatUsd(volume) },
            { label: "Tracked clicks", value: formatCompact(clicks) },
          ].map((item) => (
            <div key={item.label} className="panel shadow-panel p-5">
              <dt className="text-[13px] text-dim">{item.label}</dt>
              <dd className="num mt-2 text-[32px] font-semibold tracking-tight">{item.value}</dd>
            </div>
          ))}
        </dl>
      </main>
    </>
  );
}
