// A stand-in for GitHub, only for testing the review page's sign-in and data repo without a real GitHub App.
//   node tools/mock-github.mjs --batch <sorted.json> [--port 3499] [--login bbr-cms] [--readonly] [--no-access] [--conflict-once]
// Speaks the parts of GitHub the page uses: OAuth authorize and token, /user, /repos/<o>/<r>, and the contents API
// (list, read raw or JSON, create or update with a sha). Extra test controls: /__commits, /__file?path=, /__expire,
// /__reset-conflict. In memory only; nothing is written to disk.
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";

const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const flag = (k) => process.argv.includes(k);
const PORT = Number(arg("--port", 3499));
const LOGIN = arg("--login", "bbr-cms");
const SECRET = arg("--secret", "mock-client-secret");
const TOKEN = "mock-user-token";

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

    if (p === "/login/oauth/authorize") {
      const back = new URL(url.searchParams.get("redirect_uri"));
      back.searchParams.set("code", "mock-code");
      back.searchParams.set("state", url.searchParams.get("state"));
      res.writeHead(302, { Location: back.toString() });
      return res.end();
    }
    if (p === "/login/oauth/access_token") {
      const b = JSON.parse((await readBody(req)) || "{}");
      if (b.code !== "mock-code" || b.client_secret !== SECRET) return json(res, 200, { error: "bad_verification_code", error_description: "The code passed is incorrect or expired." });
      return json(res, 200, { access_token: TOKEN, token_type: "bearer" });
    }
    if (p === "/__commits") return json(res, 200, commits);
    if (p === "/__file") return json(res, 200, { text: files.get(url.searchParams.get("path"))?.buf.toString() ?? null });
    if (p === "/__expire") { expired = true; return json(res, 200, { ok: true }); }
    if (p === "/__unexpire") { expired = false; return json(res, 200, { ok: true }); }

    if ((req.headers.authorization ?? "") !== `Bearer ${TOKEN}` || expired) return json(res, 401, { message: "Bad credentials" });

    if (p === "/user") return json(res, 200, { login: LOGIN });
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
      commits.push({ message: b.message, path, author: LOGIN, created: !hit });
      return json(res, hit ? 200 : 201, { content: { path, sha: files.get(path).sha }, commit: { message: b.message } });
    }
    return json(res, 405, { message: "Method not allowed" });
  })
  .listen(PORT, "127.0.0.1", () => console.log(`mock GitHub on http://127.0.0.1:${PORT} (login ${LOGIN}${flag("--readonly") ? ", read-only" : ""}${flag("--no-access") ? ", no access" : ""})`));
