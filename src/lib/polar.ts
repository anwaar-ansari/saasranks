import { Polar } from "@polar-sh/sdk";

export function polarConfigured() {
  return Boolean(
    process.env.POLAR_ACCESS_TOKEN && process.env.POLAR_PRODUCT_ID,
  );
}

export function polarServer(): "sandbox" | "production" {
  return process.env.POLAR_SERVER === "production" ? "production" : "sandbox";
}

export function polarClient() {
  const token = process.env.POLAR_ACCESS_TOKEN;
  if (!token) throw new Error("POLAR_ACCESS_TOKEN is missing.");
  return new Polar({ accessToken: token, server: polarServer() });
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}
