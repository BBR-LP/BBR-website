import { sameOrigin } from "@/lib/auth";
import { allowedEmails, normalize, sendLink, throttled } from "@/lib/magic";
import { mode } from "@/lib/review";

// Always answers the same way, so the page never tells a stranger which addresses are on the list.
export async function POST(req: Request) {
  if (mode() !== "github") return new Response("not switched on", { status: 404 });
  if (!sameOrigin(req)) return new Response("forbidden", { status: 403 });
  const b = await req.json().catch(() => null);
  const email = typeof b?.email === "string" ? normalize(b.email).slice(0, 200) : "";
  if (allowedEmails().includes(email) && !throttled(email)) {
    try {
      await sendLink(email);
    } catch (e) {
      console.error("sign-in email failed:", (e as Error).message);
    }
  }
  return Response.json({ ok: true });
}
