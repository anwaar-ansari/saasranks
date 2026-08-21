import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-serif text-2xl tracking-tight">SaaSRanks</span>
          <span className="hidden text-xs uppercase tracking-[0.18em] text-cream-dim sm:inline">
            .lol for SaaS
          </span>
        </Link>
        <nav className="flex items-center gap-5 text-sm text-cream-dim">
          <Link className="hover:text-cream" href="/rules">
            Rules
          </Link>
          <Link className="hover:text-cream" href="/stats">
            Stats
          </Link>
          <a
            className="hover:text-cream"
            href="https://polar.sh"
            target="_blank"
            rel="noreferrer"
          >
            Polar
          </a>
        </nav>
      </div>
    </header>
  );
}
