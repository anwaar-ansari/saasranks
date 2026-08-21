import { BidForm } from "@/components/bid-form";
import { BoardList, Podium } from "@/components/board";
import { getBoard } from "@/lib/board";
import { formatCompact } from "@/lib/money";
import { minTakeTopCents } from "@/lib/rank";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { listings, stats, live } = await getBoard();
  const defaultAmount = Math.ceil(minTakeTopCents(listings) / 100);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-cream-dim">
            Live SaaS leaderboard
          </p>
          <h1 className="mt-3 max-w-xl font-serif text-5xl leading-[1.05] tracking-tight sm:text-6xl">
            Pay to stand above every other product.
          </h1>
        </div>
        <p className="text-sm text-cream-dim">
          {formatCompact(stats.visitors)} visitors
          {live ? " · live" : " · demo board"}
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-start">
        <div className="lg:sticky lg:top-6">
          <BidForm listings={listings} defaultAmount={defaultAmount} />
        </div>
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-serif text-2xl">The board</h2>
            <p className="text-sm text-cream-dim">
              {listings.length === 0
                ? "Empty. First paid bid takes #1."
                : `${listings.length} listed`}
            </p>
          </div>
          {listings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line px-6 py-16 text-center">
              <p className="font-serif text-3xl">The board is wide open.</p>
              <p className="mt-3 text-cream-dim">
                Place a bid on the left. Rank is the amount — nothing else.
              </p>
            </div>
          ) : (
            <>
              <Podium listings={listings} />
              <BoardList listings={listings} />
            </>
          )}
        </section>
      </div>
    </main>
  );
}
