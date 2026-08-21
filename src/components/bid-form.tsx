"use client";

import { useEffect, useState } from "react";
import { MIN_BID_DOLLARS } from "@/lib/money";

export function BidForm({ defaultAmount }: { defaultAmount: number }) {
  const [amount, setAmount] = useState(defaultAmount);
  const [url, setUrl] = useState("");
  const [tagline, setTagline] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onClaim(event: Event) {
      const dollars = (event as CustomEvent<number>).detail;
      if (typeof dollars === "number") setAmount(dollars);
      document.getElementById("product-url")?.focus();
    }
    window.addEventListener("saasranks:claim", onClaim);
    return () => window.removeEventListener("saasranks:claim", onClaim);
  }, []);

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
          category: "other",
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Checkout failed.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
      setBusy(false);
    }
  }

  return (
    <form id="bid" onSubmit={onSubmit} className="panel shadow-panel p-3">
      <label className="flex min-w-0 items-center gap-2 rounded-xl border border-line bg-raise px-3.5 py-3 focus-within:border-blue">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className="h-4 w-4 shrink-0 text-faint"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3.3 9.2h17.4M3.3 14.8h17.4" />
          <path d="M12 3c2.3 2.4 3.5 5.4 3.5 9s-1.2 6.6-3.5 9c-2.3-2.4-3.5-5.4-3.5-9S9.7 5.4 12 3Z" />
        </svg>
        <input
          id="product-url"
          placeholder="yourproduct.com"
          aria-label="Your product URL"
          className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-faint"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
      </label>
      <label className="mt-3 flex min-w-0 items-center rounded-xl border border-line bg-raise px-3.5 py-3 focus-within:border-blue">
        <input
          placeholder="One-line pitch (optional)"
          aria-label="One-line pitch"
          className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-faint"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          maxLength={160}
        />
      </label>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          aria-label="Decrease bid by 1"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-raise text-xl text-dim transition hover:border-line-strong hover:text-ink active:scale-[0.95]"
          onClick={() => setAmount((n) => Math.max(MIN_BID_DOLLARS, n - 1))}
        >
          −
        </button>
        <input
          inputMode="numeric"
          aria-label="Bid amount in US dollars"
          className="num h-16 min-w-0 flex-1 bg-transparent text-center text-[32px] font-semibold tracking-tight outline-none"
          value={`$${amount}`}
          onChange={(e) => {
            const next = Number(e.target.value.replace(/[^\d]/g, ""));
            setAmount(Number.isFinite(next) ? next : MIN_BID_DOLLARS);
          }}
        />
        <button
          type="button"
          aria-label="Increase bid by 1"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-raise text-xl text-dim transition hover:border-line-strong hover:text-ink active:scale-[0.95]"
          onClick={() => setAmount((n) => n + 1)}
        >
          +
        </button>
      </div>
      {error ? (
        <p className="mt-3 text-[13px] text-warn" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        className="mt-3 w-full rounded-xl bg-blue px-5 py-3 text-[14px] font-semibold tracking-tight text-white shadow-glow transition hover:bg-blue-hi active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
      >
        {busy ? "Opening Polar…" : "Bid"}
      </button>
    </form>
  );
}
