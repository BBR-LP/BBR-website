import { baseUrl } from "./github";
import { seal, unseal } from "./session";

// Email-link sign-in. A link is a sealed (encrypted and tamper-proof) note holding the address and an expiry, so
// there is no database to run. Only addresses on REVIEW_ALLOWED_EMAILS get a link, and the answer on screen is the
// same whether or not the address is on the list.

export const LINK_SECONDS = 15 * 60;

export const normalize = (e: string) => e.trim().toLowerCase();

export const allowedEmails = () =>
  (process.env.REVIEW_ALLOWED_EMAILS ?? "").split(/[,\s]+/).map(normalize).filter((e) => e.includes("@"));

type Link = { kind: "link"; email: string; exp: number };

export const makeLink = (email: string) =>
  `${baseUrl()}/api/auth/verify?t=${seal({ kind: "link", email, exp: Math.floor(Date.now() / 1000) + LINK_SECONDS } satisfies Link)}`;

// The address a link was made for, if the link is genuine, fresh, and the address is still allowed.
export function readLink(t: string | null): string | null {
  const l = unseal<Link>(t ?? undefined);
  if (!l || l.kind !== "link" || l.exp <= Date.now() / 1000) return null;
  return allowedEmails().includes(l.email) ? l.email : null;
}

// Best-effort limit of one email a minute per address (per server; enough to stop a stuck button or a prank).
const lastSent = new Map<string, number>();
export function throttled(email: string): boolean {
  const now = Date.now();
  if ((lastSent.get(email) ?? 0) > now - 60_000) return true;
  lastSent.set(email, now);
  return false;
}

export async function sendLink(email: string): Promise<void> {
  const key = process.env.REVIEW_RESEND_API_KEY;
  const from = process.env.REVIEW_MAIL_FROM;
  if (!key || !from) throw new Error("email sending is not set up (REVIEW_RESEND_API_KEY, REVIEW_MAIL_FROM)");
  const r = await fetch(`${process.env.RESEND_API_URL ?? "https://api.resend.com"}/emails`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Your link to choose photos",
      text: `Tap this link to open the photo review page:\n\n${makeLink(email)}\n\nIt works for 15 minutes and keeps you signed in on this device for 30 days. If you did not ask for it, you can ignore this email.`,
    }),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`the email service refused it (${r.status}): ${(await r.text()).slice(0, 200)}`);
}
