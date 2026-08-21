"use client";

import { useMemo, useState } from "react";
import { formatCompact, formatUsd } from "@/lib/money";
import { minTakeTopCents } from "@/lib/rank";
import { hashHue, relativeTime } from "@/lib/time";
import type { RankedListing } from "@/lib/types";

const PAGE_SIZE = 15;

function claimDollars(listings: RankedListing[], listing: RankedListing) {
  if (listing.rank === 1) return Math.ceil(minTakeTopCents(listings) / 100);
  return Math.floor(listing.bid_cents / 100) + 1;
}

function rowTone(rank: number) {
  if (rank === 1) return "border-blue/45 bg-[rgba(6,64,43,0.085)]";
  if (rank === 2) return "border-blue/20 bg-[rgba(6,64,43,0.045)]";
  if (rank === 3) return "border-transparent bg-[rgba(6,64,43,0.02)]";
  return "border-transparent bg-transparent";
}

function rankTone(rank: number) {
  if (rank === 1)
    return "bg-blue text-white shadow-[0_3px_10px_-3px_rgba(6,64,43,0.85)]";
  if (rank === 2) return "bg-[rgba(6,64,43,0.18)] text-blue-hi";
  if (rank === 3) return "bg-[rgba(6,64,43,0.09)] text-blue-hi";
  return "text-faint";
}

function ListingLogo({ listing }: { listing: RankedListing }) {
  const hue = hashHue(listing.listing_key);
  return (
    <span
      aria-hidden
      className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-[21px] font-semibold text-white/90 ring-1 ring-inset ring-black/10 sm:h-14 sm:w-14"
      style={{
        background: `linear-gradient(140deg, hsl(${hue} 70% 58%), hsl(${(hue + 40) % 360} 70% 34%))`,
      }}
    >
      {listing.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={listing.logo_url}
          alt=""
          className="h-full w-full rounded-2xl object-cover"
        />
      ) : (
        listing.name.slice(0, 1)
      )}
    </span>
  );
}

export function Leaderboard({ listings }: { listings: RankedListing[] }) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(listings.length / PAGE_SIZE));
  const slice = listings.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const pot = useMemo(
    () => listings.reduce((sum, l) => sum + l.bid_cents, 0),
    [listings],
  );

  function claim(listing: RankedListing) {
    const dollars = claimDollars(listings, listing);
    window.dispatchEvent(new CustomEvent("saasranks:claim", { detail: dollars }));
    document.getElementById("bid")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <section aria-label="SaaSRanks leaderboard" className="min-w-0">
      <div className="mb-3 flex items-center gap-3">
        <button type="button" className="chip shrink-0" onClick={() => location.reload()}>
          <span aria-hidden>↻</span> Refresh
        </button>
        <span className="num hidden truncate text-[12.5px] text-faint lg:inline">
          {listings.length} listings · {formatUsd(pot)} pot
        </span>
        <nav aria-label="Leaderboard pages" className="ml-auto flex shrink-0 items-center gap-1">
          <button
            type="button"
            disabled={page === 0}
            aria-label="Previous page"
            className="flex h-8 w-8 items-center justify-center rounded-full text-dim transition hover:bg-blue-ghost hover:text-blue disabled:opacity-30"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            ‹
          </button>
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Page ${i + 1}`}
              aria-current={i === page ? "page" : undefined}
              className={`num flex h-8 w-8 items-center justify-center rounded-full text-[13px] transition ${
                i === page
                  ? "bg-blue font-semibold text-white shadow-[0_3px_10px_-3px_rgba(6,64,43,0.85)]"
                  : "text-dim hover:bg-blue-ghost hover:text-blue"
              }`}
              onClick={() => setPage(i)}
            >
              {i + 1}
            </button>
          ))}
          <button
            type="button"
            disabled={page >= pages - 1}
            aria-label="Next page"
            className="flex h-8 w-8 items-center justify-center rounded-full text-dim transition hover:bg-blue-ghost hover:text-blue disabled:opacity-30"
            onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
          >
            ›
          </button>
        </nav>
      </div>

      {slice.length === 0 ? (
        <div className="panel shadow-panel px-6 py-16 text-center">
          <p className="text-lg font-semibold tracking-tight">The board is wide open.</p>
          <p className="mt-2 text-[13.5px] text-dim">
            First paid bid takes #1. Rank is the amount — nothing else.
          </p>
        </div>
      ) : (
        <div className="panel shadow-panel flex flex-col gap-2.5 p-2.5 sm:gap-3 sm:p-3">
          {slice.map((listing) => {
            const claimFor = claimDollars(listings, listing);
            return (
              <article key={listing.id} className="group relative block w-full">
                <a
                  href={`/go/${listing.id}`}
                  className={`relative block w-full rounded-2xl border px-3 py-3.5 text-left sm:px-4 sm:py-4 ${rowTone(listing.rank)}`}
                >
                  <span className="flex items-center gap-2.5 sm:gap-4">
                    <span
                      className={`num inline-flex h-7 shrink-0 items-center justify-center rounded-full px-2 text-[12px] font-semibold sm:min-w-[42px] sm:text-[13px] ${rankTone(listing.rank)}`}
                    >
                      #{listing.rank}
                    </span>
                    <ListingLogo listing={listing} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold tracking-tight transition-colors group-hover:text-blue sm:text-[16px]">
                        {listing.name}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-[13px] leading-[1.45] text-dim sm:text-[14px]">
                        {listing.tagline || listing.url.replace("https://", "")}
                      </span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px]">
                        <span className="num text-faint">{relativeTime(listing.last_bid_at)}</span>
                        <span className="inline-flex items-center gap-1.5">
                          <span aria-hidden className="h-2 w-2 rounded-full bg-green" />
                          <span className="num font-medium text-dim">
                            {formatCompact(listing.clicks)} clicks
                          </span>
                        </span>
                      </span>
                    </span>
                    <span
                      className={`num shrink-0 self-center pb-5 text-[15px] font-semibold tracking-tight sm:text-[19px] ${
                        listing.rank === 1 ? "text-blue" : "text-blue-hi"
                      }`}
                    >
                      {formatUsd(listing.bid_cents)}
                    </span>
                  </span>
                </a>
                <button
                  type="button"
                  aria-label={`Claim rank ${listing.rank} from ${listing.name} for $${claimFor}`}
                  className="absolute -top-2.5 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-blue px-3 py-1 text-[12px] font-semibold text-white opacity-100 shadow-[0_4px_12px_-4px_rgba(6,64,43,0.9)] transition duration-150 hover:bg-blue-hi sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                  onClick={() => claim(listing)}
                >
                  claim this rank for ${claimFor}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
