import { bumpVisitor } from "@/lib/board";
import { cookies } from "next/headers";

export async function POST() {
  const jar = await cookies();
  if (jar.get("sr_seen")) {
    return Response.json({ ok: true, counted: false });
  }
  await bumpVisitor();
  jar.set("sr_seen", "1", { maxAge: 60 * 60 * 24, path: "/", httpOnly: true });
  return Response.json({ ok: true, counted: true });
}
