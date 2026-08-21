import { recordClick } from "@/lib/board";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  try {
    const dest = await recordClick(id);
    if (!dest) {
      return new Response("Listing not found", { status: 404 });
    }
    return Response.redirect(dest, 302);
  } catch {
    return new Response("Listing not found", { status: 404 });
  }
}
