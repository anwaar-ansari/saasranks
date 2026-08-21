import { normalizeListingUrl } from "./listing-key";

export type SitePreview = {
  name: string;
  tagline: string;
  logoUrl: string | null;
};

function attr(html: string, key: string) {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`,
      "i",
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decode(match[1]);
  }
  return null;
}

function decode(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function titleFromHtml(html: string) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1] ? decode(match[1]) : null;
}

function hostLabel(host: string) {
  const base = host.split(".")[0] ?? host;
  return base.charAt(0).toUpperCase() + base.slice(1);
}

export async function fetchSitePreview(rawUrl: string): Promise<SitePreview> {
  const { url, host } = normalizeListingUrl(rawUrl);
  const fallback: SitePreview = {
    name: hostLabel(host),
    tagline: "",
    logoUrl: `https://www.google.com/s2/favicons?domain=${host}&sz=128`,
  };

  try {
    const res = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; SaaSRanks/1.0; +https://saasranks.app)",
        accept: "text/html",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(4500),
    });
    if (!res.ok) return fallback;
    const html = (await res.text()).slice(0, 180_000);
    const name =
      attr(html, "og:site_name") ||
      attr(html, "og:title") ||
      titleFromHtml(html) ||
      fallback.name;
    const tagline = attr(html, "og:description") || attr(html, "description") || "";
    const image = attr(html, "og:image") || attr(html, "twitter:image");
    return {
      name: name.slice(0, 80),
      tagline: tagline.slice(0, 160),
      logoUrl: image || fallback.logoUrl,
    };
  } catch {
    return fallback;
  }
}
