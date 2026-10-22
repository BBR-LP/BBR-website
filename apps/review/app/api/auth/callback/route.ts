import { baseUrl, exchangeCode, whoAndAccess } from "@/lib/github";
import { mode } from "@/lib/review";
import { clearCookie, cookie, seal, SESSION_COOKIE, SESSION_SECONDS, STATE_COOKIE } from "@/lib/session";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const page = (message: string, secure: boolean) =>
  new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Photo review</title><body style="font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem"><h1 style="font-size:1.4rem">Photo review</h1><p>${esc(message)}</p><p><a href="/api/auth/login">Try signing in again</a></p></body>`,
    { status: 400, headers: { "Content-Type": "text/html; charset=utf-8", "Set-Cookie": clearCookie(STATE_COOKIE, secure) } },
  );

export async function GET(req: Request) {
  if (mode() !== "github") return new Response("not switched on", { status: 404 });
  const secure = baseUrl().startsWith("https");
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const mine = (req.headers.get("cookie") ?? "").split(/;\s*/).find((c) => c.startsWith(`${STATE_COOKIE}=`))?.slice(STATE_COOKIE.length + 1);
  if (url.searchParams.get("error")) return page("GitHub did not complete the sign-in. You can try again.", secure);
  if (!code || !state || !mine || state !== mine) return page("That sign-in did not start on this page. Please start again.", secure);

  const ex = await exchangeCode(code);
  if (!ex.token) return page(ex.error ?? "GitHub did not accept the sign-in.", secure);
  const who = await whoAndAccess(ex.token);
  if (who.error || !who.login) return page(who.error ?? "Could not sign you in.", secure);

  const headers = new Headers({ Location: `${baseUrl()}/` });
  headers.append("Set-Cookie", cookie(SESSION_COOKIE, seal({ token: ex.token, login: who.login, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS }), SESSION_SECONDS, secure));
  headers.append("Set-Cookie", clearCookie(STATE_COOKIE, secure));
  return new Response(null, { status: 302, headers });
}
