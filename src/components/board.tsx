import { categoryLabel } from "@/lib/categories";
import { formatCompact, formatUsd } from "@/lib/money";
import type { RankedListing } from "@/lib/types";

function Logo({ listing }: { listing: RankedListing }) {
  if (!listing.logo_url) {
    return (
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-ink text-sm text-cream-dim">
        {listing.name.slice(0, 1)}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={listing.logo_url}
      alt=""
      className="h-12 w-12 shrink-0 rounded-xl object-cover bg-ink"
    />
  );
}

export function Podium({ listings }: { listings: RankedListing[] }) {
  if (listings.length === 0) return null;
  return (
    <ol className="grid gap-4 md:grid-cols-3">
      {listings.slice(0, 3).map((listing) => (
        <li
          key={listing.id}
          className="relative overflow-hidden rounded-2xl border border-line bg-ink-2 p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="font-serif text-3xl text-lime">#{listing.rank}</span>
            <span className="text-sm text-cream-dim">
              {categoryLabel(listing.category)}
            </span>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <Logo listing={listing} />
            <div className="min-w-0">
              <a
                href={`/go/${listing.id}`}
                className="block truncate text-lg font-medium hover:text-lime"
              >
                {listing.name}
              </a>
              <p className="truncate text-sm text-cream-dim">{listing.url.replace("https://", "")}</p>
            </div>
          </div>
          <p className="mt-4 min-h-10 text-sm text-cream-dim">{listing.tagline}</p>
          <div className="mt-6 flex items-end justify-between">
            <p className="font-serif text-3xl tabular">{formatUsd(listing.bid_cents)}</p>
            <p className="text-sm text-cream-dim">
              {formatCompact(listing.clicks)} clicks
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function BoardList({ listings }: { listings: RankedListing[] }) {
  const rest = listings.slice(3);
  if (rest.length === 0) return null;

  return (
    <ol className="mt-4 divide-y divide-line rounded-2xl border border-line">
      {rest.map((listing) => (
        <li
          key={listing.id}
          className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[4rem_1fr_auto_auto]"
        >
          <span className="tabular text-cream-dim">#{listing.rank}</span>
          <a href={`/go/${listing.id}`} className="min-w-0 hover:text-lime">
            <span className="block truncate font-medium">{listing.name}</span>
            <span className="block truncate text-sm text-cream-dim">
              {listing.tagline || listing.url.replace("https://", "")}
            </span>
          </a>
          <span className="hidden text-sm text-cream-dim sm:block">
            {formatCompact(listing.clicks)} clicks
          </span>
          <span className="tabular font-medium">{formatUsd(listing.bid_cents)}</span>
        </li>
      ))}
    </ol>
  );
}
