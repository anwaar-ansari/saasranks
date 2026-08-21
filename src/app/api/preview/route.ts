import { z } from "zod";
import { ListingUrlError, normalizeListingUrl } from "@/lib/listing-key";
import { fetchSitePreview } from "@/lib/og";

const Body = z.object({ url: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const body = Body.parse(await request.json());
    const { url, host } = normalizeListingUrl(body.url);
    const preview = await fetchSitePreview(url);
    return Response.json({ url, host, ...preview });
  } catch (error) {
    if (error instanceof ListingUrlError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json({ error: "Could not preview that URL." }, { status: 400 });
  }
}
