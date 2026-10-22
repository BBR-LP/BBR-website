// A stand-in for Dropbox, only for testing the review page's picture fetching without a real Dropbox app.
//   node tools/mock-dropbox.mjs --batch <sorted.json> --thumbs <review-data/thumbs> [--port 3498]
// Speaks /oauth2/token (refresh token) and /2/files/get_thumbnail_v2. A photo's file name is looked up in the batch and
// answered with the thumbnail already made for it. Extra: /__expire makes the next call return 401 once; /__calls counts.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const PORT = Number(arg("--port", 3498));
const photos = JSON.parse(fs.readFileSync(arg("--batch"), "utf8")).photos;
const byName = new Map(photos.map((p) => [p.file, p.sha256.slice(0, 16)]));
const THUMBS = arg("--thumbs");
const KEY = "mock-app-key", SECRET = "mock-app-secret", REFRESH = "mock-refresh-token";
let n = 0, tokens = 0, stale = false;

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const send = (s, body, type = "application/json") => { res.writeHead(s, { "Content-Type": type }); res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body)); };
  if (url.pathname === "/__calls") return send(200, { thumbnails: n, tokens });
  if (url.pathname === "/__expire") { stale = true; return send(200, { ok: true }); }
  if (url.pathname === "/oauth2/token") {
    let d = ""; for await (const c of req) d += c;
    const f = new URLSearchParams(d);
    const ok = req.headers.authorization === `Basic ${Buffer.from(`${KEY}:${SECRET}`).toString("base64")}` && f.get("refresh_token") === REFRESH;
    if (!ok) return send(400, { error: "invalid_grant" });
    tokens++;
    return send(200, { access_token: `mock-access-${tokens}`, token_type: "bearer", expires_in: 14400 });
  }
  if (url.pathname === "/2/files/get_thumbnail_v2") {
    if (!/^Bearer mock-access-\d+$/.test(req.headers.authorization ?? "")) return send(401, { error: "invalid_access_token" });
    if (stale) { stale = false; return send(401, { error: "expired_access_token" }); }
    const arg = JSON.parse(req.headers["dropbox-api-arg"] ?? "{}");
    const sha = byName.get(path.posix.basename(arg.resource?.path ?? ""));
    if (!arg.resource?.path?.startsWith("/Photography/") || !sha) return send(409, { error_summary: "path/not_found/." });
    n++;
    return send(200, fs.readFileSync(path.join(THUMBS, `${sha}.jpg`)), "image/jpeg");
  }
  send(404, { error: "not found" });
}).listen(PORT, "127.0.0.1", () => console.log(`mock Dropbox on http://127.0.0.1:${PORT}`));
