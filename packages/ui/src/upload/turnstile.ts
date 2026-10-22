// Cloudflare Turnstile: the invisible check that the visitor is a person. The secret stays on the server; the
// verify address can point at tools/mock-upload.mjs for testing.
export async function humanVisitor(token: unknown, ip: string | null): Promise<boolean> {
  if (typeof token !== "string" || token.length === 0 || token.length > 4096) return false;
  const body = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY as string, response: token });
  if (ip) body.set("remoteip", ip);
  try {
    const r = await fetch(process.env.TURNSTILE_VERIFY_URL ?? "https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
    return r.ok && (await r.json()).success === true;
  } catch {
    return false;
  }
}
