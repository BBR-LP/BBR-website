import { createSign } from "node:crypto";

// The GitHub side of the private data repo. The page writes as the GitHub App "BBR-LP Photo Review" (an
// installation token, minted here from the app's private key), not as a signed-in person: people sign in by
// email link (lib/magic.ts), and who chose what is recorded in the log line itself. The base address can be
// pointed at a local stand-in (tools/mock-github.mjs) so the flow can be tested without the real app.

export const apiUrl = () => process.env.GITHUB_API_URL ?? "https://api.github.com";
export const dataRepo = () => process.env.REVIEW_DATA_REPO ?? "BBR-LP/BBR-photo-data";

const appKey = () => (process.env.REVIEW_GITHUB_APP_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");

export const githubConfigured = () =>
  !!process.env.REVIEW_GITHUB_APP_ID && appKey().includes("PRIVATE KEY") && (process.env.REVIEW_SESSION_SECRET ?? "").length >= 32;

// Where emailed links point. Fixed by configuration, not read from the request.
export const baseUrl = () => (process.env.REVIEW_BASE_URL ?? "").replace(/\/$/, "");

export type GhInit = RequestInit & { accept?: string };

export function gh(token: string, path: string, init: GhInit = {}) {
  const { accept, ...rest } = init;
  return fetch(`${apiUrl()}${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: accept ?? "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "bbr-photo-review",
      ...(rest.headers ?? {}),
    },
    cache: "no-store",
  });
}

const b64 = (s: string | Buffer) => Buffer.from(s).toString("base64url");

function appJwt(): string {
  const now = Math.floor(Date.now() / 1000);
  const head = `${b64(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64(JSON.stringify({ iat: now - 60, exp: now + 540, iss: process.env.REVIEW_GITHUB_APP_ID }))}`;
  return `${head}.${b64(createSign("RSA-SHA256").update(head).sign(appKey()))}`;
}

// Installation tokens last an hour; keep one for 50 minutes so most saves do not mint a new one.
// (Kept on globalThis because Next can load this file once per route; one cache per server process is the point.)
const state = globalThis as unknown as { __reviewToken?: { token: string; until: number } | null; __reviewMinting?: Promise<string> | null };

async function mint(): Promise<string> {
  const jwt = appJwt();
  const inst = await gh(jwt, `/repos/${dataRepo()}/installation`);
  if (!inst.ok) throw new Error(`The photo app is not installed on ${dataRepo()} (${inst.status}).`);
  const id = (await inst.json()).id;
  const t = await gh(jwt, `/app/installations/${id}/access_tokens`, { method: "POST" });
  if (!t.ok) throw new Error(`GitHub would not give the photo app access (${t.status}).`);
  const token = (await t.json()).token as string;
  state.__reviewToken = { token, until: Date.now() + 50 * 60_000 };
  return token;
}

async function appToken(): Promise<string> {
  const c = state.__reviewToken;
  if (c && c.until > Date.now()) return c.token;
  return (state.__reviewMinting ??= mint().finally(() => (state.__reviewMinting = null)));
}

// A request to the data repo as the app. If GitHub says the token is no good, mint a fresh one and try once more.
export async function ghApp(path: string, init: GhInit = {}): Promise<Response> {
  const r = await gh(await appToken(), path, init);
  if (r.status !== 401) return r;
  state.__reviewToken = null;
  return gh(await appToken(), path, init);
}
