// A short-lived, one-time Dropbox upload link, so the photo goes from the visitor's phone straight to Dropbox
// (Vercel refuses requests over 4.5 MB, and a phone photo is 3 to 12 MB). The app is write-only and limited to its
// own folder; its long-lived refresh token stays here on the server and never reaches the browser. The path is
// fixed here, so a visitor can't choose where a photo goes. The base address can point at tools/mock-upload.mjs.

const apiUrl = () => process.env.DROPBOX_API_URL ?? "https://api.dropboxapi.com";

export const uploadsConfigured = () =>
  !!process.env.UPLOAD_DROPBOX_APP_KEY && !!process.env.UPLOAD_DROPBOX_APP_SECRET && !!process.env.UPLOAD_DROPBOX_REFRESH_TOKEN && !!process.env.TURNSTILE_SECRET_KEY;

let cached: { token: string; until: number } | null = null;

async function accessToken(): Promise<string> {
  if (cached && cached.until > Date.now() + 60_000) return cached.token;
  const basic = Buffer.from(`${process.env.UPLOAD_DROPBOX_APP_KEY}:${process.env.UPLOAD_DROPBOX_APP_SECRET}`).toString("base64");
  const r = await fetch(`${apiUrl()}/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: process.env.UPLOAD_DROPBOX_REFRESH_TOKEN as string }),
  });
  if (!r.ok) throw new Error(`Dropbox sign-in failed (${r.status})`);
  const j = await r.json();
  cached = { token: j.access_token, until: Date.now() + (j.expires_in ?? 14400) * 1000 };
  return cached.token;
}

export async function uploadLink(path: string): Promise<string> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await fetch(`${apiUrl()}/2/files/get_temporary_upload_link`, {
      method: "POST",
      headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ commit_info: { path, mode: "add", autorename: true, mute: true }, duration: 3600 }),
    });
    if (r.ok) return (await r.json()).link as string;
    if (r.status === 401 && attempt === 0) { cached = null; continue; } // token went stale: get a fresh one once
    throw new Error(`Dropbox ${r.status}`);
  }
  throw new Error("Dropbox refused");
}
