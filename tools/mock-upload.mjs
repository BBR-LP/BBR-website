// A stand-in for Dropbox's upload links and Cloudflare Turnstile, only for testing the /photos page without a real
// Dropbox app. It is NOT proof that real Dropbox accepts browser uploads: that needs the real write app (Clients #66).
//   node tools/mock-upload.mjs --out <folder for received photos> [--port 3497]
// Speaks /oauth2/token, /2/files/get_temporary_upload_link, POST /apitul/<id> (raw bytes, one use) and /siteverify.
// A file whose name contains FAIL gets a 413 on upload, to test the failure message. /__state lists what arrived.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import crypto from "node:crypto";

const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const PORT = Number(arg("--port", 3497));
const OUT = arg("--out");
fs.mkdirSync(OUT, { recursive: true });
const KEY = "mock-app-key", SECRET = "mock-app-secret", REFRESH = "mock-refresh-token";
const links = new Map(); // id -> { path, used }
const received = [];
let tokens = 0, challenges = 0;

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" };
  const send = (s, body) => { res.writeHead(s, { "Content-Type": "application/json", ...cors }); res.end(JSON.stringify(body)); };
  if (req.method === "OPTIONS") { res.writeHead(204, cors); return res.end(); }
  const read = async () => { const c = []; for await (const x of req) c.push(x); return Buffer.concat(c); };

  if (url.pathname === "/__state") return send(200, { received, openLinks: [...links.values()].filter((l) => !l.used).length, tokens, challenges });
  if (url.pathname === "/oauth2/token") {
    const f = new URLSearchParams((await read()).toString());
    const ok = req.headers.authorization === `Basic ${Buffer.from(`${KEY}:${SECRET}`).toString("base64")}` && f.get("refresh_token") === REFRESH;
    if (!ok) return send(400, { error: "invalid_grant" });
    tokens++;
    return send(200, { access_token: `mock-access-${tokens}`, token_type: "bearer", expires_in: 14400 });
  }
  if (url.pathname === "/2/files/get_temporary_upload_link") {
    if (!/^Bearer mock-access-\d+$/.test(req.headers.authorization ?? "")) return send(401, { error: "invalid_access_token" });
    const { commit_info: ci } = JSON.parse((await read()).toString());
    if (!ci?.path?.startsWith("/") || ci.path.includes("..")) return send(409, { error_summary: "path/malformed_path/." });
    const id = crypto.randomUUID();
    links.set(id, { path: ci.path, used: false });
    return send(200, { link: `http://127.0.0.1:${PORT}/apitul/${id}` });
  }
  if (url.pathname.startsWith("/apitul/")) {
    const l = links.get(url.pathname.split("/").pop());
    if (!l) return send(404, { error: "no such link" });
    if (l.used) return send(410, { error: "expired or already used" });
    const body = await read();
    if (path.basename(l.path).includes("FAIL")) return send(413, { error: "too large (mock)" });
    l.used = true;
    const dest = path.join(OUT, l.path);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, body);
    received.push({ path: l.path, bytes: body.length, type: req.headers["content-type"] });
    return send(200, { name: path.basename(l.path), size: body.length });
  }
  if (url.pathname === "/siteverify") {
    const f = new URLSearchParams((await read()).toString());
    challenges++;
    return send(200, { success: f.get("secret") === "mock-secret" && f.get("response") === "mock-token" });
  }
  send(404, { error: "not found" });
}).listen(PORT, "127.0.0.1", () => console.log(`mock upload on http://127.0.0.1:${PORT}, writing to ${OUT}`));
