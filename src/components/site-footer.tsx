import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-cream-dim sm:flex-row sm:items-center sm:justify-between">
        <p>Rank is the bid. Checkout by Polar. Data on Supabase.</p>
        <div className="flex gap-5">
          <Link className="hover:text-cream" href="/rules">
            Rules
          </Link>
          <Link className="hover:text-cream" href="/stats">
            Stats
          </Link>
        </div>
      </div>
    </footer>
  );
}
