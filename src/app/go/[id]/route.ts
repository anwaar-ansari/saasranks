import { recordClick } from "@/lib/board";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id) && !id.startsWith("demo-")) {
    return new Response("Listing not found", { status: 404 });
  }
  try {
    const dest = await recordClick(id);
    if (!dest || !dest.startsWith("https://")) {
      return new Response("Listing not found", { status: 404 });
    }
    return Response.redirect(dest, 302);
  } catch {
    return new Response("Listing not found", { status: 404 });
  }
}
