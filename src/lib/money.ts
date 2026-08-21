export const MIN_BID_DOLLARS = 1;
export const STEP_DOLLARS = 1;

export function dollarsToCents(dollars: number) {
  if (!Number.isInteger(dollars) || dollars < 0) {
    throw new Error("Amount must be a whole number of dollars.");
  }
  return dollars * 100;
}

export function centsToDollars(cents: number) {
  return Math.trunc(cents / 100);
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
