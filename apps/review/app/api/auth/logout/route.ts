import { sameOrigin } from "@/lib/auth";
import { baseUrl } from "@/lib/github";
import { clearCookie, SESSION_COOKIE } from "@/lib/session";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response("forbidden", { status: 403 });
  return new Response(null, { status: 303, headers: { Location: `${baseUrl() || ""}/`, "Set-Cookie": clearCookie(SESSION_COOKIE, baseUrl().startsWith("https")) } });
}
