import type { SiteSlug } from "../template/types";
import { uploadLink, uploadsConfigured } from "./dropbox";
import { checkFiles, cleanFirstName, sourceFrom, uploadPath, type FileInfo } from "./rules";
import { humanVisitor } from "./turnstile";

const reply = (status: number, body: object) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

// POST /api/photos/link: checks the request, then returns one upload link per file. `open` is the site's
// "Accept photo uploads" switch (content/uploads.json), read when the site is built, so flipping it in the editing
// screen takes effect with the next deploy (about a minute).
export function createUploadLinkHandler({ site, open }: { site: SiteSlug; open: boolean }) {
  return async function POST(req: Request) {
    if (!uploadsConfigured()) return reply(503, { error: "not_open", message: "Photo uploads aren't open yet." });
    if (!open) return reply(503, { error: "paused", message: "Photo uploads are paused right now. Please try again later." });

    // Only this site's own page may ask: a form on another website is refused.
    const origin = req.headers.get("origin");
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    if (!origin || new URL(origin).host !== host) return reply(403, { error: "forbidden", message: "That request wasn't allowed." });
    if (Number(req.headers.get("content-length") ?? 0) > 20_000) return reply(413, { error: "too_big", message: "That request was too large." });

    let body: { firstName?: unknown; source?: unknown; token?: unknown; files?: unknown };
    try { body = await req.json(); } catch { return reply(400, { error: "bad_request", message: "That request wasn't understood." }); }

    const first = cleanFirstName(body.firstName);
    if (!first) return reply(400, { error: "name", message: "Please type your first name." });
    const files: FileInfo[] = Array.isArray(body.files) ? body.files.map((f) => ({ name: String(f?.name ?? ""), size: Number(f?.size) })) : [];
    const problem = checkFiles(files);
    if (problem) return reply(400, { error: "files", message: problem });

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null;
    if (!(await humanVisitor(body.token, ip))) return reply(403, { error: "challenge", message: "We couldn't check that you're a person. Please try again." });

    const source = sourceFrom(body.source);
    const now = new Date();
    try {
      const links = await Promise.all(files.map(async (f) => ({ name: f.name, url: await uploadLink(uploadPath(site, source, first, f.name, now)) })));
      return reply(200, { links });
    } catch (e) {
      console.error(`Upload link failed for ${site}: ${e instanceof Error ? e.message : e}`);
      return reply(502, { error: "dropbox", message: "We couldn't reach our photo storage just now. Nothing was lost, please try again in a minute." });
    }
  };
}
