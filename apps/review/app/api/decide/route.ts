import { appendDecision, configured, loadBatch } from "@/lib/review";
import { SITES, type Action, type Decision, type Site } from "@/lib/types";

const ACTIONS: Action[] = ["use", "keep_off", "unsure", "clear"];

export async function POST(req: Request) {
  if (!configured()) return Response.json({ error: "not switched on" }, { status: 503 });
  const b = await req.json().catch(() => null);
  const who = typeof b?.who === "string" ? b.who.trim().slice(0, 40) : "";
  if (!who) return Response.json({ error: "Type your first name at the top first." }, { status: 400 });
  if (!ACTIONS.includes(b?.action)) return Response.json({ error: "bad action" }, { status: 400 });
  const batch = await loadBatch();
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
  };
  await appendDecision(d);
  return Response.json({ ok: true, decision: d });
}
