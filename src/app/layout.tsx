import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { VisitBeacon } from "@/components/visit-beacon";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "saasranks — bigger bid, better position",
  description:
    "A public SaaS leaderboard. Name your price, take the place it buys. Rank is the bid — nothing else.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-base text-ink">
        <VisitBeacon />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
