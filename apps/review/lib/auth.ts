import { cookies } from "next/headers";
import { baseUrl } from "./github";
import { githubStore, localStore, mode, type Store } from "./review";
import { SESSION_COOKIE, unseal, type Session } from "./session";

export async function currentSession(): Promise<Session | null> {
  const s = unseal<Session>((await cookies()).get(SESSION_COOKIE)?.value);
  return s && s.exp > Date.now() / 1000 ? s : null;
}

export type Access = { store: Store; login?: string } | { status: number; error: string };

// The store for this request, or the reason there isn't one.
export async function access(): Promise<Access> {
  const m = mode();
  if (m === "local") return { store: localStore() };
  if (m === "github") {
    const s = await currentSession();
    if (!s) return { status: 401, error: "Please sign in." };
    return { store: githubStore(s.token), login: s.login };
  }
  return { status: 503, error: "not switched on" };
}

// A save or sign-out must come from this site's own pages (a second guard on top of the cookie's SameSite).
export function sameOrigin(req: Request): boolean {
  if (mode() !== "github") return true;
  const origin = req.headers.get("origin");
  return !!origin && origin === new URL(baseUrl()).origin;
}
