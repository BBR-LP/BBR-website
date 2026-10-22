"use client";

import { useEffect, useRef, useState } from "react";
import { ACCEPT, MAX_FILES, checkFiles } from "./rules";

type Color = { primary_action: string; on_primary: string; neutral_text: string; neutral_text_muted: string; neutral_border: string; secondary_text: string };
type Row = { name: string; state: "waiting" | "sending" | "sent" | "failed"; note?: string };

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, o: object) => string; reset: (id?: string) => void };
  }
}

// Pick photos, type a first name, send. Each photo goes straight from this phone to Dropbox through a one-time
// link the server hands out after the bot check. The original file is sent as it is (no resizing), so its date
// and place stay inside it. Every photo reports its own result: nothing fails silently, and a failed one can be retried.
export function UploadForm({ business, source, siteKey, color, endpoint = "/api/photos/link" }: { business: string; source: string | null; siteKey: string; color: Color; endpoint?: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [firstName, setFirstName] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [sentCount, setSentCount] = useState(0);
  const token = useRef<string | null>(null);
  const waiting = useRef<((t: string) => void) | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | undefined>(undefined);

  // The bot check widget (invisible unless Cloudflare wants more). "mock" is for local testing only.
  useEffect(() => {
    if (siteKey === "mock") { token.current = "mock-token"; return; }
    const draw = () => {
      if (!box.current || widget.current !== undefined || !window.turnstile) return;
      widget.current = window.turnstile.render(box.current, {
        sitekey: siteKey,
        callback: (t: string) => { token.current = t; waiting.current?.(t); waiting.current = null; },
        "expired-callback": () => { token.current = null; },
      });
    };
    if (window.turnstile) { draw(); return; }
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = draw;
    document.head.appendChild(s);
  }, [siteKey]);

  // A token works once, so ask for a fresh one for each send.
  const freshToken = async (): Promise<string | null> => {
    if (siteKey === "mock") return "mock-token";
    const have = token.current;
    token.current = null;
    if (have) return have;
    return new Promise((resolve) => { waiting.current = resolve; setTimeout(() => resolve(""), 15000); }).then((t) => (t as string) || null);
  };
  const resetCheck = () => { if (siteKey !== "mock") window.turnstile?.reset(widget.current); };

  useEffect(() => {
    if (!busy) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  const send = async (toSend: File[]) => {
    setProblem(null);
    const early = checkFiles(toSend.map((f) => ({ name: f.name, size: f.size })));
    if (early) return setProblem(early);
    if (!firstName.trim()) return setProblem("Please type your first name.");
    setBusy(true);
    const mark = (name: string, patch: Partial<Row>) => setRows((r) => r.map((x) => (x.name === name ? { ...x, ...patch } : x)));
    setRows(toSend.map((f) => ({ name: f.name, state: "waiting" })));
    const t = await freshToken();
    if (!t) { setBusy(false); return setProblem("We couldn't check that you're a person. Please wait a moment and try again."); }
    let links: { name: string; url: string }[];
    try {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, source, token: t, files: toSend.map((f) => ({ name: f.name, size: f.size })) }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.message ?? "Something went wrong. Please try again.");
      links = j.links;
    } catch (e) {
      resetCheck();
      setRows([]);
      setBusy(false);
      return setProblem(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    }
    resetCheck();
    let ok = 0;
    for (const f of toSend) {
      const link = links.find((l) => l.name === f.name)?.url;
      mark(f.name, { state: "sending" });
      try {
        if (!link) throw new Error("no link");
        const up = await fetch(link, { method: "POST", headers: { "Content-Type": "application/octet-stream" }, body: f });
        if (!up.ok) throw new Error(`Dropbox said ${up.status}`);
        mark(f.name, { state: "sent" });
        ok++;
      } catch (e) {
        mark(f.name, { state: "failed", note: e instanceof Error ? e.message : "Couldn't send" });
      }
    }
    setSentCount((n) => n + ok);
    setBusy(false);
  };

  const failed = rows.filter((r) => r.state === "failed");
  const allDone = rows.length > 0 && !busy && failed.length === 0;
  const again = () => { setFiles([]); setRows([]); setProblem(null); setSentCount(0); };

  if (allDone) {
    return (
      <div className="text-center">
        <p className="text-2xl">Thank you{firstName ? `, ${firstName}` : ""}!</p>
        <p className="mt-3" style={{ color: color.neutral_text_muted }}>{sentCount === 1 ? "Your photo is on its way" : `Your ${sentCount} photos are on their way`} to {business}.</p>
        <button type="button" onClick={again} className="mt-8 rounded-full px-6 py-3 text-sm font-medium" style={{ background: color.primary_action, color: color.on_primary }}>Add more photos</button>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); void send(files); }} className="grid gap-6">
      <label className="grid gap-2">
        <span className="text-sm font-medium">Your photos</span>
        <input type="file" multiple accept={ACCEPT} disabled={busy} onChange={(e) => { setFiles([...(e.target.files ?? [])]); setRows([]); }}
          className="block w-full rounded-lg border p-3 text-sm" style={{ borderColor: color.neutral_border }} />
        <span className="text-xs" style={{ color: color.neutral_text_muted }}>Up to {MAX_FILES} at a time. Pick them from your photo library, not from a message or screenshot, so the date and place come along.</span>
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium">Your first name</span>
        <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={busy} autoComplete="given-name" maxLength={30}
          className="block w-full rounded-lg border p-3" style={{ borderColor: color.neutral_border }} />
        <span className="text-xs" style={{ color: color.neutral_text_muted }}>We use it to credit you.</span>
      </label>
      <div ref={box} />
      <p className="text-sm" style={{ color: color.neutral_text_muted }}>By sending, you agree {business} may use these photos on its website and social media.</p>

      {problem && <p role="alert" className="rounded-lg border p-3 text-sm" style={{ borderColor: "#b42318", color: "#b42318" }}>{problem}</p>}

      {rows.length > 0 && (
        <ul className="grid gap-2 text-sm" aria-live="polite">
          {rows.map((r) => (
            <li key={r.name} className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
              <span className="truncate">{r.name}</span>
              <span title={r.note} style={{ color: r.state === "failed" ? "#b42318" : color.neutral_text_muted }}>
                {r.state === "waiting" ? "Waiting" : r.state === "sending" ? "Sending…" : r.state === "sent" ? "Sent ✓" : "Didn't send. Tap the button below to try again."}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-3">
        {failed.length > 0 && !busy ? (
          <button type="button" onClick={() => void send(files.filter((f) => failed.some((x) => x.name === f.name)))} className="rounded-full px-6 py-3 text-sm font-medium" style={{ background: color.primary_action, color: color.on_primary }}>Try the ones that didn't send again</button>
        ) : (
          <button type="submit" disabled={busy || files.length === 0} className="rounded-full px-6 py-3 text-sm font-medium disabled:opacity-50" style={{ background: color.primary_action, color: color.on_primary }}>
            {busy ? "Sending…" : files.length > 1 ? `Send ${files.length} photos` : "Send photo"}
          </button>
        )}
      </div>
    </form>
  );
}
