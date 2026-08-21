"use client";

import Link from "next/link";
import { useEffect } from "react";
import { formatCompact, formatUsd } from "@/lib/money";
import type { RankedListing } from "@/lib/types";

export function SiteHeader({
  listings,
  visitors,
}: {
  listings: RankedListing[];
  visitors: number;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      event.preventDefault();
      document.getElementById("bid")?.scrollIntoView({ behavior: "smooth", block: "center" });
      document.getElementById("product-url")?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-base/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="saasranks.lol home" className="flex shrink-0 items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-blue text-white">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
              <path
                d="M2.5 11.5 6 8l2.5 2.5 5-6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="text-[17px] font-bold italic tracking-tighter">
            saasranks<span className="text-blue">.lol</span>
          </span>
        </Link>
        <div className="ml-auto hidden items-center gap-2 sm:flex">
          <span className="inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-2.5 py-1.5">
            <span className="h-1.5 w-1.5 animate-breathe rounded-full bg-green" />
            <span className="num text-[13px] font-semibold text-green">1</span>
            <span className="label text-green">watching</span>
          </span>
          <span className="inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-2.5 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-green" />
            <span className="num text-[13px] font-semibold text-ink">
              {formatCompact(visitors)}
            </span>
            <span className="label">visitors / 24h</span>
          </span>
          <Link
            href="/stats"
            className="label rounded-lg px-2 py-1.5 transition hover:bg-blue-ghost hover:text-blue"
          >
            Full stats ↗
          </Link>
        </div>
        <a
          href="#bid"
          className="ml-auto inline-flex items-center gap-2 rounded-lg bg-blue px-3 py-2 text-[13px] font-semibold tracking-tight text-white transition hover:bg-blue-hi active:scale-[0.97] sm:ml-0"
        >
          Bid
          <span className="kbd hidden border-white/25 bg-white/15 text-white/80 sm:inline">/</span>
        </a>
      </div>
      <div className="flex h-9 items-center justify-center gap-4 border-t border-line px-4 text-[12px] sm:hidden">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-breathe rounded-full bg-green" />
          <span className="num font-semibold text-green">1</span>
          <span className="text-green">watching</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-green" />
          <span className="num font-semibold text-ink">{formatCompact(visitors)}</span>
          <span className="text-dim">visitors / 24h</span>
        </span>
        <Link href="/stats" className="font-semibold text-blue">
          Full stats ↗
        </Link>
      </div>
      {listings.length > 0 ? (
        <nav aria-label="Ranked products" className="marquee border-t border-line bg-panel/90">
          <div className="marquee-track">
            {[0, 1].map((copy) => (
              <div key={copy} className="marquee-group" aria-hidden={copy === 1}>
                {listings.slice(0, 15).map((listing) => (
                  <a
                    key={`${copy}-${listing.id}`}
                    href={`/go/${listing.id}`}
                    className="marquee-item transition hover:text-blue"
                  >
                    <span className="num text-blue">#{listing.rank}</span>
                    <span className="font-semibold text-ink">{listing.name}</span>
                    <span className="num text-blue-hi">{formatUsd(listing.bid_cents)}</span>
                    <span className="text-faint/50">•</span>
                  </a>
                ))}
              </div>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
