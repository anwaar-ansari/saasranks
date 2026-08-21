import { MIN_BID_DOLLARS, STEP_DOLLARS, TOP_PREMIUM_DOLLARS } from "@/lib/money";

export const metadata = {
  title: "Rules · SaaSRanks",
};

export default function RulesPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-14">
      <p className="text-xs uppercase tracking-[0.22em] text-cream-dim">Rules</p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">Rank is the bid.</h1>
      <p className="mt-5 text-lg text-cream-dim">
        SaaSRanks is a public leaderboard for software products. There are no ads,
        no algorithms, and no revenue share with listed companies. You pay Polar
        to stand above everyone else.
      </p>

      <section className="mt-12">
        <h2 className="font-serif text-2xl">How ranking works</h2>
        <ul className="mt-4 space-y-3 text-cream-dim">
          <li>
            New listings are whole US dollars, ${MIN_BID_DOLLARS} minimum, $
            {STEP_DOLLARS} at a time. Bids already on the board keep their amount
            until they raise or get outranked.
          </li>
          <li>
            Taking #1 costs at least ${TOP_PREMIUM_DOLLARS} more than the current
            top bid. Paying less still puts you on the board at whatever rank that
            bid can take. Equal bids stay in the order they were placed — the
            older bid keeps the higher rank.
          </li>
          <li>
            Enter the same website again to raise that listing. The new bid must
            be at least ${STEP_DOLLARS} above your current bid; you only pay the
            difference. Someone else cannot take your rank by paying that
            difference.
          </li>
          <li>
            App Store, Play Store, GitHub, and similar platform links are keyed
            by their path so different products don’t share a bid. Tracking query
            strings are ignored.
          </li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-2xl">What you can list</h2>
        <ul className="mt-4 space-y-3 text-cream-dim">
          <li>A SaaS product website. Profiles that are not products may be removed.</li>
          <li>
            Chat and invite links are not allowed — Telegram, WhatsApp, Discord,
            Messenger, Signal, and similar.
          </li>
          <li>Adult and NSFW products are not allowed.</li>
          <li>
            Query parameters are stripped. Affiliate, referral, and tracking URLs
            will not work. Link shorteners are rejected.
          </li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-2xl">After you pay</h2>
        <ul className="mt-4 space-y-3 text-cream-dim">
          <li>
            Polar handles checkout as merchant of record. A completed payment is
            what claims the rank — Polar webhooks write the listing to Supabase.
          </li>
          <li>
            Your listing is public. Clicks go through SaaSRanks so they can be
            counted, then redirect to the URL you submitted.
          </li>
        </ul>
      </section>
    </main>
  );
}
