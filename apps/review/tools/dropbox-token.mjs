// One-time setup: gets the long-lived Dropbox refresh token for the review page.
//   node --env-file=.env tools/dropbox-token.mjs            (the review page's read-only app)
//   node --env-file=.env tools/dropbox-token.mjs --upload   (the upload page's write-only app)
// Needs REVIEW_DROPBOX_APP_KEY and _APP_SECRET in .env (or UPLOAD_DROPBOX_APP_KEY and _APP_SECRET with --upload). Sign in to Dropbox as the business account,
// approve, and paste the code Dropbox shows. The token prints here, once; put it in Proton Pass and in .env.
import readline from "node:readline/promises";

const prefix = process.argv.includes("--upload") ? "UPLOAD" : "REVIEW";
const key = process.env[`${prefix}_DROPBOX_APP_KEY`];
const secret = process.env[`${prefix}_DROPBOX_APP_SECRET`];
if (!key || !secret) { console.error(`Set ${prefix}_DROPBOX_APP_KEY and ${prefix}_DROPBOX_APP_SECRET in .env first.`); process.exit(1); }

console.log("\n1. Open this address, sign in as the business Dropbox, and click Allow:\n");
console.log(`   https://www.dropbox.com/oauth2/authorize?client_id=${encodeURIComponent(key)}&response_type=code&token_access_type=offline\n`);
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const code = (await rl.question("2. Paste the code Dropbox shows: ")).trim();
rl.close();

const r = await fetch("https://api.dropboxapi.com/oauth2/token", {
  method: "POST",
  headers: { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ code, grant_type: "authorization_code" }),
});
const j = await r.json();
if (!j.refresh_token) { console.error("\nDropbox said no:", j.error_description ?? j.error ?? r.status); process.exit(1); }
console.log("\nScopes granted:", j.scope);
console.log(`\nREFRESH TOKEN (copy into Proton Pass, then into .env as ${prefix}_DROPBOX_REFRESH_TOKEN):\n\n${j.refresh_token}\n`);
