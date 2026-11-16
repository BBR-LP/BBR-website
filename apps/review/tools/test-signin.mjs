// End-to-end check of email-link sign-in against stand-ins for GitHub and Resend. Run from apps/review:
//   node tools/test-signin.mjs <sorted.json>
// Starts the stand-ins and the page itself, exercises it over HTTP, prints PASS/FAIL per check, stops everything.
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const batch = process.argv[2];
if (!batch) throw new Error("usage: node tools/test-signin.mjs <sorted.json>");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "signin-"));
const pem = path.join(tmp, "app.pem");
fs.writeFileSync(pem, crypto.generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey.export({ type: "pkcs8", format: "pem" }));
const PAGE = "http://127.0.0.1:3490", GH = "http://127.0.0.1:3499", MAIL = "http://127.0.0.1:3498";
const procs = [];
const run = (args, env = {}) => { const p = spawn(args[0], args.slice(1), { env: { ...process.env, ...env }, stdio: "ignore" }); procs.push(p); return p; };
const wait = async (url) => { for (let i = 0; i < 120; i++) { try { await fetch(url); return; } catch { await new Promise((r) => setTimeout(r, 500)); } } throw new Error(`${url} did not start`); };
const get = (u, h = {}) => fetch(u, { redirect: "manual", headers: h });
const post = (u, body, h = {}) => fetch(u, { method: "POST", redirect: "manual", headers: { "Content-Type": "application/json", Origin: PAGE, ...h }, body: JSON.stringify(body) });
const cookieOf = (r) => (r.headers.get("set-cookie") ?? "").split(";")[0];
const results = [];
const check = async (name, fn) => { try { await fn(); results.push(["PASS", name]); } catch (e) { results.push(["FAIL", `${name}: ${e.message}`]); } };

try {
  run(["node", "tools/mock-github.mjs", "--private-key", pem, "--batch", batch, "--conflict-once"]);
  run(["node", "tools/mock-resend.mjs"]);
  run(["npx", "next", "dev", "-p", "3490"], {
    REVIEW_MODE: "github", REVIEW_SESSION_SECRET: "x".repeat(40), REVIEW_BASE_URL: PAGE, REVIEW_DATA_REPO: "BBR-LP/BBR-photo-data",
    REVIEW_GITHUB_APP_ID: "12345", REVIEW_GITHUB_APP_PRIVATE_KEY: fs.readFileSync(pem, "utf8").replace(/\n/g, "\\n"),
    GITHUB_API_URL: GH, RESEND_API_URL: MAIL, REVIEW_RESEND_API_KEY: "mock-resend-key", REVIEW_MAIL_FROM: "photos@example.com",
    REVIEW_ALLOWED_EMAILS: "Kristen@Example.com, greg@example.com",
  });
  await Promise.all([wait(`${GH}/__mints`), wait(`${MAIL}/__sent`), wait(PAGE)]);
  const sent = async () => (await (await fetch(`${MAIL}/__sent`)).json());
  const linkIn = (m) => m.text.match(/https?:\/\/\S+/)[0];

  await check("signed out: page asks for email, API refuses", async () => {
    assert.match(await (await get(PAGE)).text(), /Enter your email/);
    assert.equal((await post(`${PAGE}/api/decide`, { who: "K", sha: "x", action: "use" })).status, 401);
    assert.equal((await get(`${PAGE}/api/thumb/${"a".repeat(16)}`)).status, 401);
  });
  await check("request from another site is refused", async () => {
    assert.equal((await post(`${PAGE}/api/auth/request`, { email: "greg@example.com" }, { Origin: "https://evil.example" })).status, 403);
  });
  await check("address not on the list: same answer, no email", async () => {
    const r = await post(`${PAGE}/api/auth/request`, { email: "stranger@example.com" });
    assert.deepEqual(await r.json(), { ok: true });
    assert.equal((await sent()).length, 0);
  });
  let link;
  await check("listed address (any capitals): one email with a link", async () => {
    assert.equal((await post(`${PAGE}/api/auth/request`, { email: " KRISTEN@example.com " })).status, 200);
    const m = await sent();
    assert.equal(m.length, 1);
    assert.deepEqual(m[0].to, ["kristen@example.com"]);
    link = linkIn(m[0]);
    assert.ok(link.startsWith(`${PAGE}/api/auth/verify?t=`));
  });
  await check("second request within a minute sends nothing more", async () => {
    await post(`${PAGE}/api/auth/request`, { email: "kristen@example.com" });
    assert.equal((await sent()).length, 1);
  });
  await check("tampered link is refused", async () => {
    assert.equal((await get(link.slice(0, -4) + "AAAA")).status, 400);
    assert.equal((await get(`${PAGE}/api/auth/verify`)).status, 400);
  });
  let cookie;
  await check("good link signs in and sets a long, HttpOnly cookie", async () => {
    const r = await get(link);
    assert.equal(r.status, 302);
    const sc = r.headers.get("set-cookie");
    assert.match(sc, /HttpOnly/); assert.match(sc, /Max-Age=2592000/);
    cookie = cookieOf(r);
  });
  await check("signed in: page shows photos and the email", async () => {
    const t = await (await get(PAGE, { Cookie: cookie })).text();
    assert.match(t, /kristen@example\.com/);
    assert.doesNotMatch(t, /Enter your email/);
  });
  let sha;
  await check("a choice is saved as one commit by the app, with who and email", async () => {
    const photos = JSON.parse(fs.readFileSync(batch, "utf8")).photos;
    sha = photos[0].sha256;
    const r = await post(`${PAGE}/api/decide`, { who: "Kristen", sha, action: "unsure" }, { Cookie: cookie });
    assert.equal(r.status, 200, await r.text());
    const commits = await (await fetch(`${GH}/__commits`)).json();
    assert.equal(commits.length, 1);
    const wk = commits[0].path;
    const text = (await (await fetch(`${GH}/__file?path=${wk}`)).json()).text;
    const d = JSON.parse(text.trim().split("\n").pop());
    assert.equal(d.by, "kristen@example.com"); assert.equal(d.who, "Kristen");
  });
  await check("a token minted once serves several saves (conflict retry included)", async () => {
    for (const a of ["use", "keep_off", "clear"]) assert.equal((await post(`${PAGE}/api/decide`, { who: "Kristen", sha, action: a, site: "boat" }, { Cookie: cookie })).status, 200);
    assert.equal((await (await fetch(`${GH}/__mints`)).json()).mints, 1);
  });
  await check("12 simultaneous taps, 12 saved", async () => {
    const before = (await (await fetch(`${GH}/__commits`)).json()).length;
    const rs = await Promise.all(Array.from({ length: 12 }, () => post(`${PAGE}/api/decide`, { who: "Greg", sha, action: "unsure" }, { Cookie: cookie })));
    assert.ok(rs.every((r) => r.status === 200));
    assert.equal((await (await fetch(`${GH}/__commits`)).json()).length - before, 12);
  });
  await check("GitHub revokes the token: the page mints a new one and still saves", async () => {
    await fetch(`${GH}/__expire`);
    assert.equal((await post(`${PAGE}/api/decide`, { who: "Greg", sha, action: "unsure" }, { Cookie: cookie })).status, 200);
    assert.equal((await (await fetch(`${GH}/__mints`)).json()).mints, 2);
  });
  await check("forged or other-purpose cookies do not sign in", async () => {
    assert.equal((await post(`${PAGE}/api/decide`, { who: "X", sha, action: "unsure" }, { Cookie: "review_session=abc.def.ghi" })).status, 401);
    const asSession = "review_session=" + link.split("t=")[1]; // a link used as a cookie
    assert.equal((await post(`${PAGE}/api/decide`, { who: "X", sha, action: "unsure" }, { Cookie: asSession })).status, 401);
  });
  await check("sign out clears the cookie; the old password-less path is gone", async () => {
    const r = await post(`${PAGE}/api/auth/logout`, {});
    assert.match(r.headers.get("set-cookie"), /Max-Age=0/);
    assert.equal((await get(`${PAGE}/api/auth/login`)).status, 404);
  });
} finally {
  procs.forEach((p) => p.kill());
  fs.rmSync(tmp, { recursive: true, force: true });
}
for (const [s, n] of results) console.log(s, n);
process.exit(results.some(([s]) => s === "FAIL") ? 1 : 0);
