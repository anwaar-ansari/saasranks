export const MIN_BID_DOLLARS = 5;
export const TOP_PREMIUM_DOLLARS = 5;
export const STEP_DOLLARS = 1;

export function dollarsToCents(dollars: number) {
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number) {
  return cents / 100;
}

export function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(centsToDollars(cents));
}

export function formatCompact(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}
