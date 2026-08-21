"use client";

import { useEffect, useMemo, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { MIN_BID_DOLLARS, formatUsd } from "@/lib/money";
import { minTakeTopCents } from "@/lib/rank";
import type { RankedListing } from "@/lib/types";

type Quote = {
  rank: number | null;
  pay?: number;
  existing?: boolean;
  error?: string;
};

export function BidForm({
  listings,
  defaultAmount,
}: {
  listings: RankedListing[];
  defaultAmount: number;
}) {
  const topAsk = Math.ceil(minTakeTopCents(listings) / 100);
  const [amount, setAmount] = useState(defaultAmount);
  const [url, setUrl] = useState("");
  const [tagline, setTagline] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["value"]>(
    "other",
  );
  const [quote, setQuote] = useState<Quote>({ rank: 1 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const params = new URLSearchParams({ amount: String(amount) });
      if (url.trim()) params.set("url", url.trim());
      const res = await fetch(`/api/quote?${params}`, { signal: controller.signal });
      const data = (await res.json()) as Quote;
      setQuote(data);
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [amount, url]);

  const rankLabel = useMemo(() => {
    if (quote.error && !quote.rank) return quote.error;
    if (!quote.rank) return "Enter a bid to see rank";
    if (quote.existing && quote.pay != null) {
      return `Takes #${quote.rank} · you pay ${formatUsd(quote.pay * 100)} more`;
    }
    return `Takes #${quote.rank}`;
  }, [quote]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url,
          amount,
          tagline,
          category,
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Checkout failed.");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-line bg-ink-2 p-5 sm:p-6"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-cream-dim">
        Claim a rank
      </p>
      <div className="mt-4 flex items-end justify-between gap-4">
        <label className="block">
          <span className="text-sm text-cream-dim">Bid (USD)</span>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-xl border border-line text-lg hover:border-cream/40"
              onClick={() => setAmount((n) => Math.max(MIN_BID_DOLLARS, n - 1))}
              aria-label="Decrease bid"
            >
              −
            </button>
            <input
              className="h-11 w-28 rounded-xl border border-line bg-ink px-3 text-center text-lg tabular outline-none focus:border-lime"
              inputMode="numeric"
              value={amount}
              onChange={(e) => {
                const next = Number(e.target.value.replace(/[^\d]/g, ""));
                setAmount(Number.isFinite(next) ? next : MIN_BID_DOLLARS);
              }}
            />
            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-xl border border-line text-lg hover:border-cream/40"
              onClick={() => setAmount((n) => n + 1)}
              aria-label="Increase bid"
            >
              +
            </button>
          </div>
        </label>
        <p className="max-w-[14rem] text-right text-sm text-lime">{rankLabel}</p>
      </div>

      <label className="mt-5 block">
        <span className="text-sm text-cream-dim">Product URL</span>
        <input
          className="mt-2 h-11 w-full rounded-xl border border-line bg-ink px-3 outline-none placeholder:text-cream-dim/50 focus:border-lime"
          placeholder="linear.app"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
      </label>

      <label className="mt-4 block">
        <span className="text-sm text-cream-dim">One-line pitch</span>
        <input
          className="mt-2 h-11 w-full rounded-xl border border-line bg-ink px-3 outline-none placeholder:text-cream-dim/50 focus:border-lime"
          placeholder="Issue tracking your team actually likes"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          maxLength={160}
        />
      </label>

      <label className="mt-4 block">
        <span className="text-sm text-cream-dim">Category</span>
        <select
          className="mt-2 h-11 w-full rounded-xl border border-line bg-ink px-3 outline-none focus:border-lime"
          value={category}
          onChange={(e) =>
            setCategory(e.target.value as (typeof CATEGORIES)[number]["value"])
          }
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      {error ? (
        <p className="mt-4 text-sm text-warn" role="alert">
          {error}
        </p>
      ) : (
        <p className="mt-4 text-sm text-cream-dim">
          New spots start at ${MIN_BID_DOLLARS}. Taking #1 costs ${topAsk} right
          now. Same URL again raises your listing — you only pay the difference.
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-5 h-12 w-full rounded-xl bg-lime font-medium text-lime-ink transition hover:brightness-95 disabled:opacity-60"
      >
        {busy ? "Opening Polar…" : "Place bid"}
      </button>
    </form>
  );
}
