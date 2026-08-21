import { formatCompact } from "@/lib/money";
import { hashHue, relativeTime } from "@/lib/time";
import type { ActivityEvent, RankedListing, TrendingItem } from "@/lib/types";

function MiniLogo({ listing }: { listing: RankedListing }) {
  const hue = hashHue(listing.listing_key);
  return (
    <span
      aria-hidden
      className="flex h-8 w-8 shrink-0 overflow-hidden rounded-lg ring-1 ring-inset ring-black/10"
      style={{
        background: `linear-gradient(140deg, hsl(${hue} 70% 58%), hsl(${(hue + 40) % 360} 70% 34%))`,
      }}
    >
      {listing.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={listing.logo_url} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="grid h-full w-full place-items-center text-[11px] font-semibold text-white">
          {listing.name.slice(0, 1)}
        </span>
      )}
    </span>
  );
}

export function LiveFeed({ events }: { events: ActivityEvent[] }) {
  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3">
        <span className="h-1.5 w-1.5 animate-breathe rounded-full bg-green" />
        <h2 className="text-[12px] font-bold uppercase tracking-[0.14em] text-green">
          Live
        </h2>
      </div>
      {events.length === 0 ? (
        <p className="px-4 pb-4 text-[13.5px] text-dim">
          No bids yet. First payment shows up here.
        </p>
      ) : (
        <ul>
          {events.map((event) => (
            <li
              key={event.id}
              className="flex items-baseline gap-2 border-t border-line px-4 py-3 text-[14px]"
            >
              <span aria-hidden>{event.kind === "reclaimed" ? "👑" : "🔥"}</span>
              <p className="min-w-0 flex-1 text-dim">
                <a href={`/go/${event.listingId}`} className="font-semibold text-ink hover:text-blue">
                  {event.name}
                </a>{" "}
                {event.kind === "reclaimed"
                  ? "reclaimed #1"
                  : `entered the war at #${event.rank}`}
              </p>
              <span className="num shrink-0 text-[13px] text-faint">
                {relativeTime(event.at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function Trending({ items }: { items: TrendingItem[] }) {
  return (
    <section>
      <h2 className="text-[18px] font-semibold tracking-tight">
        🔥 Trending right now
      </h2>
      <p className="mt-1 text-[13.5px] text-dim">
        Real clicks in the last hour. Money can&apos;t buy this one.
      </p>
      <ol className="panel mt-3 divide-y divide-line overflow-hidden">
        {items.length === 0 ? (
          <li className="px-4 py-8 text-center text-[13.5px] text-dim">
            Clicks will land here once the board is live.
          </li>
        ) : (
          items.map((item, index) => (
            <li key={item.listing.id}>
              <a
                href={`/go/${item.listing.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-raise"
              >
                <span className="num w-4 text-[13px] text-faint">{index + 1}</span>
                <MiniLogo listing={item.listing} />
                <span className="min-w-0 flex-1 truncate font-semibold">
                  {item.listing.name}
                </span>
                <span className="num shrink-0 text-[13px] text-faint">
                  {formatCompact(item.clicksPerHour)} clicks/h
                </span>
              </a>
            </li>
          ))
        )}
      </ol>
    </section>
  );
}
