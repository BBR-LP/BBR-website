import { access, sameOrigin } from "@/lib/auth";
import { Unauthorized } from "@/lib/review";
import { SITES, type Action, type Decision, type Site } from "@/lib/types";

const ACTIONS: Action[] = ["use", "keep_off", "unsure", "clear"];

export async function POST(req: Request) {
  if (!sameOrigin(req)) return Response.json({ error: "That did not come from the review page." }, { status: 403 });
  const a = await access();
  if ("error" in a) return Response.json({ error: a.error, signedOut: a.status === 401 }, { status: a.status });

  const b = await req.json().catch(() => null);
  const who = typeof b?.who === "string" ? b.who.trim().slice(0, 40) : "";
  if (!who) return Response.json({ error: "Type your first name at the top first." }, { status: 400 });
  if (!ACTIONS.includes(b?.action)) return Response.json({ error: "bad action" }, { status: 400 });
  try {
    const batch = await a.store.loadBatch();
    const photo = batch.photos.find((p) => p.sha256 === b?.sha);
    if (!photo) return Response.json({ error: "unknown photo" }, { status: 404 });
    const site: Site | null = b.action === "use" ? (SITES.includes(b.site) ? b.site : photo.site) : null;
    if (b.action === "use" && !site) return Response.json({ error: "Pick which business first." }, { status: 400 });
    const d: Decision = {
      at: new Date().toISOString(),
      who,
      sha: photo.sha256,
      action: b.action,
      site,
      note: typeof b.note === "string" ? b.note.slice(0, 300) : undefined,
      children_ok: b.action === "use" && photo.people === "minors" ? true : undefined,
      by: a.login,
    };
    await a.store.appendDecision(d, `${b.action} ${photo.file} (${who})`);
    return Response.json({ ok: true, decision: d });
  } catch (e) {
    if (e instanceof Unauthorized) return Response.json({ error: "Your sign-in has run out.", signedOut: true }, { status: 401 });
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
}
