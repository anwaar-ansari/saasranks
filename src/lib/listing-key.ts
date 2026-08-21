const CHAT_HOSTS = [
  "t.me",
  "telegram.me",
  "wa.me",
  "api.whatsapp.com",
  "chat.whatsapp.com",
  "discord.gg",
  "discord.com",
  "signal.me",
  "m.me",
];

const SHORTENERS = [
  "bit.ly",
  "t.co",
  "tinyurl.com",
  "ow.ly",
  "buff.ly",
  "rebrand.ly",
  "cutt.ly",
  "shorturl.at",
  "rb.gy",
];

export class ListingUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ListingUrlError";
  }
}

export function normalizeListingUrl(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) throw new ListingUrlError("Enter a product URL.");

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    throw new ListingUrlError("That doesn’t look like a valid URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ListingUrlError("Only http and https links are allowed.");
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");

  if (CHAT_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
    throw new ListingUrlError(
      "Chat and invite links are not allowed. List a product site.",
    );
  }

  if (SHORTENERS.includes(host)) {
    throw new ListingUrlError(
      "Link shorteners are not allowed. Use the canonical product URL.",
    );
  }

  url.hash = "";
  url.search = "";
  url.hostname = host;
  url.protocol = "https:";

  if (url.pathname !== "/" && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }

  const keepPath =
    host === "github.com" ||
    host === "apps.apple.com" ||
    host === "play.google.com" ||
    host.endsWith(".github.io");

  const listingKey = keepPath
    ? `${host}${url.pathname}`.toLowerCase()
    : host;

  const href =
    url.pathname === "/" ? `https://${host}` : `https://${host}${url.pathname}`;

  return { listingKey, url: href, host };
}
