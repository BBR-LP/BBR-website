import { access } from "@/lib/auth";
import { mode, readLocalThumb } from "@/lib/review";

// Until the business Dropbox is connected (Clients #96), a hosted page shows a stand-in, not a photo.
const STAND_IN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#e7e5e4"/><text x="200" y="150" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#57534e">Photo not connected yet</text></svg>`;

export async function GET(_req: Request, ctx: { params: Promise<{ sha: string }> }) {
  const a = await access();
  if ("error" in a) return new Response(a.error, { status: a.status });
  const { sha } = await ctx.params;
  if (!/^[a-f0-9]{16,64}$/.test(sha)) return new Response("bad request", { status: 400 });
  if (mode() === "github") return new Response(STAND_IN, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "private, no-store" } });
  try {
    return new Response(new Uint8Array(await readLocalThumb(sha)), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=3600" } });
  } catch {
    return new Response("not found", { status: 404 });
  }
}
