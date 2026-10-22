import { authorizeUrl, baseUrl } from "@/lib/github";
import { mode } from "@/lib/review";
import { cookie, newState, STATE_COOKIE } from "@/lib/session";

export async function GET() {
  if (mode() !== "github") return new Response("not switched on", { status: 404 });
  const state = newState();
  return new Response(null, {
    status: 302,
    headers: { Location: authorizeUrl(state), "Set-Cookie": cookie(STATE_COOKIE, state, 600, baseUrl().startsWith("https")) },
  });
}
