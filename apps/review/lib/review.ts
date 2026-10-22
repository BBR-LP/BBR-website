import fs from "node:fs/promises";
import path from "node:path";
import type { Decision, Photo } from "./types";

// The photo review page's data. Nothing here is public: the page serves photos only when the data
// folder is configured (REVIEW_MODE=local plus REVIEW_DATA_DIR), and the folder is never in git.
// Later: photos read from the business Dropbox, decisions kept in a private data repo, sign-in with GitHub.
// See bre/shared/photo-journal/001-workflow-plan.md (Part 5) and decision 013 A10.

export const configured = () => process.env.REVIEW_MODE === "local" && !!process.env.REVIEW_DATA_DIR;
const dir = () => process.env.REVIEW_DATA_DIR as string;

export async function loadBatch(): Promise<{ made: string; photos: Photo[] }> {
  return JSON.parse(await fs.readFile(path.join(dir(), "sorted.json"), "utf8"));
}

export async function readDecisions(): Promise<Record<string, Decision>> {
  let text = "";
  try {
    text = await fs.readFile(path.join(dir(), "decisions.jsonl"), "utf8");
  } catch {
    return {};
  }
  const state: Record<string, Decision> = {};
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const d = JSON.parse(line) as Decision;
    if (d.action === "clear") delete state[d.sha];
    else state[d.sha] = d;
  }
  return state;
}

// Every selection is one line in an append-only log: who, when, what. Nothing is ever rewritten.
export async function appendDecision(d: Decision) {
  await fs.appendFile(path.join(dir(), "decisions.jsonl"), JSON.stringify(d) + "\n");
}

export const thumbFile = (sha: string) => `${sha.slice(0, 16)}.jpg`;
export const readThumb = (sha: string) => fs.readFile(path.join(dir(), "thumbs", thumbFile(sha)));
