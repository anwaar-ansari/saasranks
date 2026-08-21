import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <nav
        aria-label="Footer"
        className="mx-auto flex max-w-[1240px] flex-col gap-3 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        <Link href="/" className="text-[17px] font-bold italic tracking-tighter">
          saasranks
        </Link>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-dim">
          <Link className="hover:text-blue" href="/rules">
            Rules
          </Link>
          <a className="hover:text-blue" href="https://polar.sh" target="_blank" rel="noreferrer">
            Payments by Polar
          </a>
          <a className="hover:text-blue" href="https://rankbid.lol" target="_blank" rel="noreferrer">
            Inspired by rankbid.lol
          </a>
        </div>
      </nav>
      <p className="mx-auto max-w-[1240px] px-4 pb-8 text-[12.5px] text-faint sm:px-6">
        Query strings are stripped from every listing link, so affiliate, referral,
        and tracking URLs won&apos;t work here.
      </p>
    </footer>
  );
}
