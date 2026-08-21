import { BidForm } from "@/components/bid-form";
import { Leaderboard } from "@/components/board";
import { SiteHeader } from "@/components/site-header";
import { getBoard } from "@/lib/board";
import { minTakeTopCents } from "@/lib/rank";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { listings, stats } = await getBoard();
  const defaultAmount = Math.ceil(minTakeTopCents(listings) / 100);

  return (
    <main className="relative min-h-screen">
      <SiteHeader listings={listings} visitors={stats.visitors} />
      <div
        id="top"
        className="mx-auto grid max-w-[1240px] items-start gap-4 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-6 lg:pt-10"
      >
        <div className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-[104px] lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto lg:pr-1">
          <div>
            <h1 className="text-[clamp(2.4rem,4.2vw,3.4rem)] font-semibold leading-[1.02] tracking-tightest">
              Bigger bid.
              <span className="block text-dim">Better position.</span>
            </h1>
            <p className="mt-2 text-[13.5px] leading-relaxed text-dim">
              No judges, votes, or secret sauce. Name your price, take the place
              it buys, and enjoy the view until someone arrives with one more
              dollar.
            </p>
          </div>
          <BidForm defaultAmount={defaultAmount} />
        </div>
        <Leaderboard listings={listings} />
      </div>
    </main>
  );
}
