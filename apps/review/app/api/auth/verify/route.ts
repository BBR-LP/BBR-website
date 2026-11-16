import { baseUrl } from "@/lib/github";
import { readLink } from "@/lib/magic";
import { mode } from "@/lib/review";
import { cookie, seal, SESSION_COOKIE, SESSION_SECONDS } from "@/lib/session";

const gone = () =>
  new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Photo review</title><body style="font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem"><h1 style="font-size:1.4rem">Photo review</h1><p>That link has run out. Links work for 15 minutes.</p><p><a href="/">Get a new link</a></p></body>`,
    { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );

export async function GET(req: Request) {
  if (mode() !== "github") return new Response("not switched on", { status: 404 });
  const email = readLink(new URL(req.url).searchParams.get("t"));
  if (!email) return gone();
  const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${baseUrl()}/`,
      "Set-Cookie": cookie(SESSION_COOKIE, seal({ kind: "session", email, exp }), SESSION_SECONDS, baseUrl().startsWith("https")),
      "Cache-Control": "no-store",
    },
  });
}
