// Pictures for the hosted page come from the business Dropbox, one thumbnail at a time, so no copies are stored.
// A read-only Dropbox app (files.metadata.read + files.content.read) is connected once with a long-lived refresh
// token; this file swaps it for a short-lived access token and asks Dropbox for a small JPEG.
// The path asked for always comes from the batch in the private data repo, never from the browser's request.
// The two base addresses can point at tools/mock-dropbox.mjs for testing.

const apiUrl = () => process.env.DROPBOX_API_URL ?? "https://api.dropboxapi.com";
const contentUrl = () => process.env.DROPBOX_CONTENT_URL ?? "https://content.dropboxapi.com";

export const dropboxConfigured = () =>
  !!process.env.REVIEW_DROPBOX_APP_KEY && !!process.env.REVIEW_DROPBOX_APP_SECRET && !!process.env.REVIEW_DROPBOX_REFRESH_TOKEN;

let cached: { token: string; until: number } | null = null;

async function accessToken(): Promise<string> {
  if (cached && cached.until > Date.now() + 60_000) return cached.token;
  const basic = Buffer.from(`${process.env.REVIEW_DROPBOX_APP_KEY}:${process.env.REVIEW_DROPBOX_APP_SECRET}`).toString("base64");
  const r = await fetch(`${apiUrl()}/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: process.env.REVIEW_DROPBOX_REFRESH_TOKEN as string }),
  });
  if (!r.ok) throw new Error(`Dropbox sign-in failed (${r.status})`);
  const j = await r.json();
  cached = { token: j.access_token, until: Date.now() + (j.expires_in ?? 14400) * 1000 };
  return cached.token;
}

// Dropbox wants its argument as JSON in a header, which must be plain ASCII: escape everything else.
const asciiJson = (o: unknown) => JSON.stringify(o).replace(/[\u007f-￿]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);

export async function thumbnail(path: string): Promise<ArrayBuffer> {
  const arg = { resource: { ".tag": "path", path }, format: "jpeg", size: "w1024h768", mode: "bestfit" };
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await fetch(`${contentUrl()}/2/files/get_thumbnail_v2`, {
      method: "POST",
      headers: { Authorization: `Bearer ${await accessToken()}`, "Dropbox-API-Arg": asciiJson(arg) },
    });
    if (r.ok) return r.arrayBuffer();
    if (r.status === 401 && attempt === 0) { cached = null; continue; } // token went stale: get a fresh one once
    throw new Error(`Dropbox ${r.status}`);
  }
  throw new Error("Dropbox refused");
}
