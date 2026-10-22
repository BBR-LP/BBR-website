import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// A signed-in person is a cookie: their GitHub token and login, encrypted (AES-256-GCM) with a secret that
// only the server has, so there is no database to run and nothing to read in the browser. The token can
// write to the private data repo, which is why it is encrypted, HttpOnly, and short-lived.

export type Session = { token: string; login: string; exp: number };

export const SESSION_COOKIE = "review_session";
export const STATE_COOKIE = "review_oauth_state";
export const SESSION_SECONDS = 8 * 60 * 60; // GitHub App user tokens last 8 hours

const key = () => {
  const secret = process.env.REVIEW_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("REVIEW_SESSION_SECRET must be set (32+ characters)");
  return createHash("sha256").update(secret).digest();
};

const b64 = (b: Buffer) => b.toString("base64url");

export function seal(value: object): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([c.update(JSON.stringify(value), "utf8"), c.final()]);
  return [b64(iv), b64(body), b64(c.getAuthTag())].join(".");
}

export function unseal<T>(sealed: string | undefined): T | null {
  if (!sealed) return null;
  try {
    const [iv, body, tag] = sealed.split(".").map((p) => Buffer.from(p, "base64url"));
    const d = createDecipheriv("aes-256-gcm", key(), iv);
    d.setAuthTag(tag);
    return JSON.parse(Buffer.concat([d.update(body), d.final()]).toString("utf8")) as T;
  } catch {
    return null; // tampered, wrong secret, or garbage: treat as signed out
  }
}

export const newState = () => randomBytes(16).toString("base64url");

export function cookie(name: string, value: string, maxAgeSeconds: number, secure: boolean) {
  return `${name}=${value}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`;
}
export const clearCookie = (name: string, secure: boolean) => cookie(name, "", 0, secure);
