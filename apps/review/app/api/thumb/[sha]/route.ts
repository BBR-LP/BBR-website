import { configured, readThumb } from "@/lib/review";

export async function GET(_req: Request, ctx: { params: Promise<{ sha: string }> }) {
  if (!configured()) return new Response("not switched on", { status: 503 });
  const { sha } = await ctx.params;
  if (!/^[a-f0-9]{16,64}$/.test(sha)) return new Response("bad request", { status: 400 });
  try {
    const bytes = await readThumb(sha);
    return new Response(new Uint8Array(bytes), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=3600" } });
  } catch {
    return new Response("not found", { status: 404 });
  }
}
