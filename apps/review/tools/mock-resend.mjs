// A stand-in for Resend (email sending), only for testing the sign-in link without sending real email.
//   node tools/mock-resend.mjs [--port 3498] [--fail]
// POST /emails records the message; GET /__sent lists them. In memory only.
import http from "node:http";
const PORT = Number(process.argv.includes("--port") ? process.argv[process.argv.indexOf("--port") + 1] : 3498);
const sent = [];
http
  .createServer(async (req, res) => {
    if (req.url === "/__sent") { res.writeHead(200, { "Content-Type": "application/json" }); return res.end(JSON.stringify(sent)); }
    if (req.url === "/emails" && req.method === "POST") {
      let d = ""; for await (const c of req) d += c;
      if (process.argv.includes("--fail")) { res.writeHead(422, { "Content-Type": "application/json" }); return res.end('{"message":"domain not verified"}'); }
      if (req.headers.authorization !== "Bearer mock-resend-key") { res.writeHead(401); return res.end("{}"); }
      sent.push(JSON.parse(d)); res.writeHead(200, { "Content-Type": "application/json" }); return res.end('{"id":"mock"}');
    }
    res.writeHead(404); res.end();
  })
  .listen(PORT, "127.0.0.1", () => console.log(`mock Resend on http://127.0.0.1:${PORT}`));
