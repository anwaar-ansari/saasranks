import { BidForm } from "@/components/bid-form";
import { Leaderboard } from "@/components/board";
import { LiveFeed, Trending } from "@/components/feed";
import { SiteHeader } from "@/components/site-header";
import { getBoard } from "@/lib/board";
import { minTakeTopCents } from "@/lib/rank";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { listings, stats, activity, trending } = await getBoard();
  const defaultAmount = Math.ceil(minTakeTopCents(listings) / 100);

  return (
    <main className="relative min-h-screen">
      <SiteHeader visitors={stats.visitors} />
      <div
        id="top"
        className="mx-auto grid max-w-[1240px] items-start gap-4 px-4 pb-10 pt-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-6 lg:pt-10"
      >
        <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-96px)] lg:overflow-y-auto lg:pr-1">
          <div>
            <h1 className="text-[clamp(2.4rem,4.2vw,3.4rem)] font-semibold leading-[1.02] tracking-tightest">
              Want the top spot?
              <span className="block text-dim">Outbid for it.</span>
            </h1>
            <p className="mt-3 max-w-sm text-[13.5px] leading-relaxed text-dim">
              No votes. No algorithms. Just SaaS products competing for a better
              position.
            </p>
            <a
              href="#bid"
              className="mt-5 inline-flex rounded-xl bg-blue px-5 py-3 text-[14px] font-semibold tracking-tight text-white shadow-glow transition hover:bg-blue-hi"
            >
              Bid for your spot
            </a>
          </div>
          <BidForm defaultAmount={defaultAmount} />
        </div>
        <Leaderboard listings={listings} />
      </div>
      <div className="mx-auto grid max-w-[1240px] gap-8 px-4 pb-16 sm:px-6 lg:grid-cols-2">
        <LiveFeed events={activity} />
        <Trending items={trending} />
      </div>
    </main>
  );
}
