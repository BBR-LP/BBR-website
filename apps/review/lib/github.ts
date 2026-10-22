// The GitHub side of sign-in and of the private data repo. The two base addresses can be pointed at a
// local stand-in (tools/mock-github.mjs) so the whole flow can be tested without a real GitHub App.

export const webUrl = () => process.env.GITHUB_WEB_URL ?? "https://github.com";
export const apiUrl = () => process.env.GITHUB_API_URL ?? "https://api.github.com";
export const dataRepo = () => process.env.REVIEW_DATA_REPO ?? "BBR-LP/BBR-photo-data";

export const githubConfigured = () =>
  !!process.env.REVIEW_GITHUB_CLIENT_ID && !!process.env.REVIEW_GITHUB_CLIENT_SECRET && (process.env.REVIEW_SESSION_SECRET ?? "").length >= 32;

// Where GitHub sends people back to. Fixed by configuration, not read from the request.
export const baseUrl = () => (process.env.REVIEW_BASE_URL ?? "").replace(/\/$/, "");
export const redirectUri = () => `${baseUrl()}/api/auth/callback`;

export function authorizeUrl(state: string) {
  const q = new URLSearchParams({ client_id: process.env.REVIEW_GITHUB_CLIENT_ID as string, redirect_uri: redirectUri(), state });
  return `${webUrl()}/login/oauth/authorize?${q}`;
}

export async function exchangeCode(code: string): Promise<{ token?: string; error?: string }> {
  const r = await fetch(`${webUrl()}/login/oauth/access_token`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.REVIEW_GITHUB_CLIENT_ID,
      client_secret: process.env.REVIEW_GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri(),
    }),
    cache: "no-store",
  });
  const b = await r.json().catch(() => ({}));
  return b.access_token ? { token: b.access_token } : { error: b.error_description ?? b.error ?? "GitHub did not accept the sign-in" };
}

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

// Signed in AND allowed: the person's own GitHub token must be able to write to the private data repo.
// (A GitHub App's user token only reaches repos the app is installed on AND the person can access.)
export async function whoAndAccess(token: string): Promise<{ login?: string; error?: string }> {
  const u = await gh(token, "/user");
  if (!u.ok) return { error: "GitHub would not say who you are." };
  const login = (await u.json()).login as string;
  const repo = await gh(token, `/repos/${dataRepo()}`);
  if (!repo.ok) return { login, error: `${login} cannot open the photo data. Ask for access to ${dataRepo()}.` };
  const perms = (await repo.json()).permissions;
  if (!perms?.push) return { login, error: `${login} can look at the photo data but not save choices to it.` };
  return { login };
}
