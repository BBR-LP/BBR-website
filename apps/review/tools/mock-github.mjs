// A stand-in for GitHub, only for testing the review page's data repo without the real GitHub App.
//   node tools/mock-github.mjs --private-key <app.pem> [--app-id 12345] --batch <sorted.json> [--port 3499] [--readonly] [--no-access] [--conflict-once]
// Speaks the parts of GitHub the page uses: the app's installation lookup and token (checking the app's signed
// JWT against the given key), /repos/<o>/<r>, and the contents API (list, read raw or JSON, create or update with
// a sha). Extra test controls: /__commits, /__file?path=, /__expire (next token is refused once), /__mints.
// In memory only; nothing is written to disk.
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";

const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const flag = (k) => process.argv.includes(k);
const PORT = Number(arg("--port", 3499));
const APP_ID = arg("--app-id", "12345");
const PUBLIC_KEY = crypto.createPublicKey(fs.readFileSync(arg("--private-key"), "utf8"));
let TOKEN = "none-yet";
let mints = 0;

function validJwt(auth) {
  const m = auth.match(/^Bearer ([\w-]+)\.([\w-]+)\.([\w-]+)$/);
  if (!m) return false;
  const claims = JSON.parse(Buffer.from(m[2], "base64url"));
  const ok = crypto.createVerify("RSA-SHA256").update(`${m[1]}.${m[2]}`).verify(PUBLIC_KEY, Buffer.from(m[3], "base64url"));
  return ok && String(claims.iss) === APP_ID && claims.exp > Date.now() / 1000;
}

const sha1 = (b) => crypto.createHash("sha1").update(b).digest("hex");
const files = new Map(); // path -> { buf, sha }
const put = (p, buf) => files.set(p, { buf, sha: sha1(buf) });
put("batches/.gitkeep", Buffer.alloc(0));
put("decisions/.gitkeep", Buffer.alloc(0));
if (arg("--batch")) put("batches/2026-10-22/sorted.json", fs.readFileSync(arg("--batch")));

const commits = [];
let expired = false;
let conflictOnce = flag("--conflict-once");

const json = (res, status, body, extra = {}) => {
  res.writeHead(status, { "Content-Type": "application/json", ...extra });
  res.end(JSON.stringify(body));
};
const readBody = (req) => new Promise((r) => { let d = ""; req.on("data", (c) => (d += c)); req.on("end", () => r(d)); });

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
    const p = url.pathname;

    if (p === "/__commits") return json(res, 200, commits);
    if (p === "/__file") return json(res, 200, { text: files.get(url.searchParams.get("path"))?.buf.toString() ?? null });
    if (p === "/__expire") { TOKEN = "revoked"; expired = true; return json(res, 200, { ok: true }); }
    if (p === "/__mints") return json(res, 200, { mints });

    const inst = p.match(/^\/repos\/([^/]+)\/([^/]+)\/installation$/);
    if (inst) return validJwt(req.headers.authorization ?? "") ? json(res, 200, { id: 777 }) : json(res, 401, { message: "A JSON web token could not be decoded" });
    if (p === "/app/installations/777/access_tokens" && req.method === "POST") {
      if (!validJwt(req.headers.authorization ?? "")) return json(res, 401, { message: "A JSON web token could not be decoded" });
      mints++; TOKEN = `mock-installation-token-${mints + 1}`; expired = false;
      return json(res, 201, { token: TOKEN, expires_at: new Date(Date.now() + 3600_000).toISOString() });
    }

    if ((req.headers.authorization ?? "") !== `Bearer ${TOKEN}` || expired) return json(res, 401, { message: "Bad credentials" });

    const m = p.match(/^\/repos\/([^/]+)\/([^/]+)(?:\/contents\/(.*))?$/);
    if (!m) return json(res, 404, { message: "Not Found" });
    if (flag("--no-access")) return json(res, 404, { message: "Not Found" });
    const path = m[3] === undefined ? null : decodeURIComponent(m[3]);
    if (path === null) return json(res, 200, { full_name: `${m[1]}/${m[2]}`, private: true, permissions: { push: !flag("--readonly") } });

    if (req.method === "GET") {
      const hit = files.get(path);
      if (hit) {
        if ((req.headers.accept ?? "").includes("raw")) { res.writeHead(200, { "Content-Type": "application/octet-stream" }); return res.end(hit.buf); }
        return json(res, 200, { name: path.split("/").pop(), path, type: "file", sha: hit.sha, encoding: "base64", content: hit.buf.toString("base64").replace(/(.{60})/g, "$1\n") });
      }
      const kids = new Map();
      for (const k of files.keys()) if (k.startsWith(path + "/")) { const rest = k.slice(path.length + 1); const name = rest.split("/")[0]; kids.set(name, rest.includes("/") ? "dir" : "file"); }
      if (kids.size === 0) return json(res, 404, { message: "Not Found" });
      return json(res, 200, [...kids].map(([name, type]) => ({ name, type, path: `${path}/${name}` })));
    }
    if (req.method === "PUT") {
      if (flag("--readonly")) return json(res, 403, { message: "Resource not accessible by integration" });
      const b = JSON.parse(await readBody(req));
      const hit = files.get(path);
      if (conflictOnce && path.startsWith("decisions/")) { conflictOnce = false; return json(res, 409, { message: `${path} does not match` }); }
      if (hit && !b.sha) return json(res, 422, { message: "Invalid request. \"sha\" wasn't supplied." });
      if (hit && b.sha !== hit.sha) return json(res, 409, { message: `${path} does not match ${b.sha}` });
      put(path, Buffer.from(b.content, "base64"));
      commits.push({ message: b.message, path, created: !hit });
      return json(res, hit ? 200 : 201, { content: { path, sha: files.get(path).sha }, commit: { message: b.message } });
    }
    return json(res, 405, { message: "Method not allowed" });
  })
  .listen(PORT, "127.0.0.1", () => console.log(`mock GitHub on http://127.0.0.1:${PORT} (app ${APP_ID}${flag("--readonly") ? ", read-only" : ""}${flag("--no-access") ? ", no access" : ""})`));
