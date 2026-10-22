import fs from "node:fs/promises";
import path from "node:path";
import { baseUrl, dataRepo, gh, githubConfigured } from "./github";
import type { Decision, Photo } from "./types";

// The review page's data. Two ways to run it, and nothing is served unless one is configured:
//   local   REVIEW_MODE=local + REVIEW_DATA_DIR: a folder from photo-tools (no sign-in; for trying it on one machine)
//   github  REVIEW_MODE=github + the GitHub App settings: sign in with GitHub; batches and decisions live in the
//           private data repo (BBR-LP/BBR-photo-data), written with the signed-in person's own token
// Photos themselves come from the business Dropbox later (Clients #96); until then the hosted page shows a
// stand-in image. Plan: bre/shared/photo-journal/001-workflow-plan.md (Part 5), decision 013 A10.

export type Mode = "local" | "github";
export function mode(): Mode | null {
  if (process.env.REVIEW_MODE === "local" && process.env.REVIEW_DATA_DIR) return "local";
  if (process.env.REVIEW_MODE === "github" && githubConfigured() && baseUrl()) return "github";
  return null;
}
export const configured = () => mode() !== null;

export class Unauthorized extends Error {}
export class NoBatch extends Error {}

export type Batch = { made: string; photos: Photo[] };
export type Store = {
  loadBatch(): Promise<Batch>;
  readDecisions(): Promise<Record<string, Decision>>;
  appendDecision(d: Decision, label: string): Promise<void>;
};

// Every selection is one line in an append-only log: who, when, what. Nothing is ever rewritten.
// The latest line per photo wins; a "clear" removes the choice.
export function fold(lines: string[]): Record<string, Decision> {
  const all = lines
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => JSON.parse(l) as Decision)
    .sort((a, b) => a.at.localeCompare(b.at));
  const state: Record<string, Decision> = {};
  for (const d of all) {
    if (d.action === "clear") delete state[d.sha];
    else state[d.sha] = d;
  }
  return state;
}

// ---------- local folder ----------
const dir = () => process.env.REVIEW_DATA_DIR as string;

export function localStore(): Store {
  return {
    async loadBatch() {
      return JSON.parse(await fs.readFile(path.join(dir(), "sorted.json"), "utf8"));
    },
    async readDecisions() {
      try {
        return fold((await fs.readFile(path.join(dir(), "decisions.jsonl"), "utf8")).split("\n"));
      } catch {
        return {};
      }
    },
    async appendDecision(d) {
      await fs.appendFile(path.join(dir(), "decisions.jsonl"), JSON.stringify(d) + "\n");
    },
  };
}

export const thumbFile = (sha: string) => `${sha.slice(0, 16)}.jpg`;
export const readLocalThumb = (sha: string) => fs.readFile(path.join(dir(), "thumbs", thumbFile(sha)));

// ---------- the private data repo ----------
const isoWeek = (iso: string) => {
  const d = new Date(iso);
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const week = Math.ceil(((t.getTime() - Date.UTC(t.getUTCFullYear(), 0, 1)) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};

// Saves to one file go through a queue in this server, one at a time, so people tapping together do not collide
// with each other; other servers (Vercel runs several) can still collide, hence the retry with a short random wait.
const queues = new Map<string, Promise<unknown>>();
function inTurn<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const run = (queues.get(key) ?? Promise.resolve()).then(fn, fn);
  queues.set(key, run.catch(() => undefined));
  return run;
}
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function githubStore(token: string): Store {
  const repo = dataRepo();
  const guard = (status: number) => {
    if (status === 401) throw new Unauthorized("sign-in expired");
  };

  async function list(p: string): Promise<{ name: string; type: string }[]> {
    const r = await gh(token, `/repos/${repo}/contents/${p}`);
    guard(r.status);
    if (r.status === 404) return [];
    if (!r.ok) throw new Error(`Could not list ${p} (${r.status})`);
    return r.json();
  }
  async function raw(p: string): Promise<string> {
    const r = await gh(token, `/repos/${repo}/contents/${p}`, { accept: "application/vnd.github.raw+json" });
    guard(r.status);
    if (!r.ok) throw new Error(`Could not read ${p} (${r.status})`);
    return r.text();
  }

  return {
    async loadBatch() {
      const dirs = (await list("batches")).filter((e) => e.type === "dir").map((e) => e.name).sort();
      if (dirs.length === 0) throw new NoBatch("No photos have been sent to review yet.");
      return JSON.parse(await raw(`batches/${dirs[dirs.length - 1]}/sorted.json`));
    },
    async readDecisions() {
      const files = (await list("decisions")).filter((e) => e.type === "file" && e.name.endsWith(".jsonl"));
      const texts = await Promise.all(files.map((f) => raw(`decisions/${f.name}`)));
      return fold(texts.flatMap((t) => t.split("\n")));
    },
    // One commit per choice, under the signed-in person's own GitHub login: the history is the audit trail.
    // Two people saving at once is handled by re-reading and trying again.
    async appendDecision(d, label) {
      const p = `decisions/${isoWeek(d.at)}.jsonl`;
      return inTurn(p, async () => {
      for (let attempt = 0; attempt < 6; attempt++) {
        if (attempt > 0) await pause(80 + Math.random() * 220);
        const cur = await gh(token, `/repos/${repo}/contents/${p}`);
        guard(cur.status);
        let text = "";
        let sha: string | undefined;
        if (cur.ok) {
          const j = await cur.json();
          sha = j.sha;
          text = Buffer.from(j.content ?? "", "base64").toString("utf8");
        } else if (cur.status !== 404) {
          throw new Error(`Could not read the log (${cur.status})`);
        }
        const body = { message: `choice: ${label}`, content: Buffer.from(text + (text && !text.endsWith("\n") ? "\n" : "") + JSON.stringify(d) + "\n").toString("base64"), sha };
        const put = await gh(token, `/repos/${repo}/contents/${p}`, { method: "PUT", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
        guard(put.status);
        if (put.ok) return;
        if (put.status !== 409 && put.status !== 422) throw new Error(`Could not save (${put.status})`);
      }
      throw new Error("Someone else was saving at the same moment. Please tap again.");
      });
    },
  };
}
