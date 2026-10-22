import { access } from "@/lib/auth";
import { dropboxConfigured, thumbnail } from "@/lib/dropbox";
import { mode, readLocalThumb, type Store } from "@/lib/review";

const card = (text: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#e7e5e4"/><text x="200" y="150" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#57534e">${text}</text></svg>`;
const svg = (text: string) => new Response(card(text), { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "private, no-store" } });

// sha -> Dropbox path, from the latest batch; kept for a few minutes so a page of thumbnails is one read, not fifty.
let pathCache: { at: number; byId: Map<string, string | null> } | null = null;
async function dropboxPath(store: Store, sha: string): Promise<string | null | undefined> {
  if (!pathCache || Date.now() - pathCache.at > 5 * 60_000) {
    const batch = await store.loadBatch();
    pathCache = { at: Date.now(), byId: new Map(batch.photos.map((p) => [p.sha256, p.dropbox_path ?? null])) };
  }
  return pathCache.byId.get(sha);
}

export async function GET(_req: Request, ctx: { params: Promise<{ sha: string }> }) {
  const a = await access();
  if ("error" in a) return new Response(a.error, { status: a.status });
  const { sha } = await ctx.params;
  if (!/^[a-f0-9]{16,64}$/.test(sha)) return new Response("bad request", { status: 400 });

  if (mode() === "github") {
    if (!dropboxConfigured()) return svg("Photo not connected yet");
    try {
      const path = await dropboxPath(a.store, sha);
      if (path === undefined) return new Response("not found", { status: 404 });
      if (!path) return svg("No picture for this one");
      // A thumbnail never changes for a given photo, so the browser may keep it for a day (private: never a shared cache).
      return new Response(await thumbnail(path), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=86400" } });
    } catch {
      return svg("Could not load this photo");
    }
  }
  try {
    return new Response(new Uint8Array(await readLocalThumb(sha)), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=3600" } });
  } catch {
    return new Response("not found", { status: 404 });
  }
}
