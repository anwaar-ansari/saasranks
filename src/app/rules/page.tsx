import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { getBoard } from "@/lib/board";
import { MIN_BID_DOLLARS, STEP_DOLLARS } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Rules — saasranks",
};

export default async function RulesPage() {
  const { stats } = await getBoard();

  return (
    <>
      <SiteHeader visitors={stats.visitors} />
      <main className="mx-auto max-w-[720px] px-4 py-10 sm:px-6 sm:py-14">
        <Link href="/" className="text-[13px] font-medium text-blue hover:text-blue-hi">
          ← Back to the board
        </Link>
        <p className="mt-8 text-[13px] text-faint">Rules — saasranks</p>
        <h1 className="mt-2 text-[36px] font-semibold tracking-tight">Rules</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-dim">
          SaaSRanks is a public leaderboard for SaaS products. There are no ads,
          votes, reviews, or algorithm. Your position is the amount you have paid
          for that listing—nothing else.
        </p>

        <h2 className="mt-10 text-[20px] font-semibold tracking-tight">How ranking works</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-dim marker:text-blue">
          <li>Bids are whole US dollars, starting at ${MIN_BID_DOLLARS}.</li>
          <li>
            Your displayed bid is your position. Paying less than #1 still puts
            you wherever that total reaches.
          </li>
          <li>Equal bids keep their original order. The listing that arrived first stays higher.</li>
          <li>
            Submit the same website again to climb. Set the new total you want; at
            checkout, you pay only the difference from your current bid.
          </li>
          <li>
            Taking #1 requires at least ${STEP_DOLLARS} more than the current top
            bid. Equal bids keep the older listing higher.
          </li>
          <li>
            A checkout does not reserve a rank. Payment sets this product&apos;s
            total bid to the amount you chose. Rank is computed afterward from
            the live board (highest bid, then oldest listing).
          </li>
        </ul>

        <h2 className="mt-10 text-[20px] font-semibold tracking-tight">What you can list</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-dim marker:text-blue">
          <li>A SaaS product website you own or run.</li>
          <li>
            Group-chat and invite links are not listed. That includes Telegram,
            WhatsApp, Discord, Signal, Messenger, and similar services.
          </li>
          <li>Sexual, adult, illegal, deceptive, or malicious content is not listed.</li>
          <li>
            Query parameters and fragments are removed, so affiliate, referral,
            and tracking links will not work.
          </li>
          <li>
            App Store, Play Store, and GitHub links are keyed by path so different
            products don&apos;t share a bid.
          </li>
        </ul>

        <h2 className="mt-10 text-[20px] font-semibold tracking-tight">After you pay</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-dim marker:text-blue">
          <li>
            A completed Polar payment claims the bid. The listing normally appears
            or moves within a minute.
          </li>
          <li>
            Clicks go through SaaSRanks, then to the submitted URL. The click
            count is public.
          </li>
          <li>
            Submitting an existing domain updates its bid instead of creating a
            duplicate listing.
          </li>
        </ul>

        <h2 className="mt-10 text-[20px] font-semibold tracking-tight">Payments and refunds</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-dim marker:text-blue">
          <li>Payments are processed by Polar as merchant of record.</li>
          <li>
            Bids are non-refundable. Being outbid is not a refund reason—your
            listing remains on the board at its new rank.
          </li>
          <li>Listings that break these rules may be removed without a refund.</li>
        </ul>
      </main>
    </>
  );
}
