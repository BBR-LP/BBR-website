"use client";

import { useEffect, useMemo, useState } from "react";
import { SITES, SITE_NAMES, type Action, type Decision, type Photo, type Site } from "@/lib/types";

type Item = Omit<Photo, "reasons">;
type Sec = { key: string; label: string; note?: string; items: Item[] };

const STATE = {
  use: { label: "Use", ring: "ring-2 ring-emerald-500", badge: "bg-emerald-600 text-white", mark: "✓" },
  keep_off: { label: "Keep off", ring: "ring-2 ring-rose-500", badge: "bg-rose-600 text-white", mark: "✕" },
  unsure: { label: "Not sure", ring: "ring-2 ring-amber-400", badge: "bg-amber-500 text-stone-900", mark: "?" },
} as const;

const niceDate = (t: string | null) =>
  t ? new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "date unknown";

export function ReviewGrid({ sections, initial, made }: { sections: Sec[]; initial: Record<string, Decision>; made: string }) {
  const [decisions, setDecisions] = useState(initial);
  const [tab, setTab] = useState(sections[0]?.key ?? "");
  const [who, setWho] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [open, setOpen] = useState<Item | null>(null);

  useEffect(() => {
    try {
      setWho(localStorage.getItem("review-who") ?? "");
    } catch {}
  }, []);
  const saveWho = (v: string) => {
    setWho(v);
    try {
      localStorage.setItem("review-who", v);
    } catch {}
  };

  const all = useMemo(() => [...new Map(sections.flatMap((s) => s.items).map((p) => [p.sha256, p])).values()], [sections]);
  const count = (a: Action) => all.filter((p) => decisions[p.sha256]?.action === a).length;
  const decided = all.filter((p) => decisions[p.sha256]).length;
  const section = sections.find((s) => s.key === tab) ?? sections[0];
  const shown = section ? section.items.filter((p) => !onlyOpen || !decisions[p.sha256]) : [];

  async function decide(p: Item, action: Action, extra: { site?: Site | null; note?: string } = {}) {
    if (!who.trim()) {
      setError("Type your first name at the top first, so we know who chose.");
      return;
    }
    setError("");
    const before = decisions;
    const site = extra.site ?? decisions[p.sha256]?.site ?? p.site;
    const optimistic: Decision = { at: new Date().toISOString(), who: who.trim(), sha: p.sha256, action, site, note: extra.note };
    setDecisions((d) => {
      const n = { ...d };
      if (action === "clear") delete n[p.sha256];
      else n[p.sha256] = optimistic;
      return n;
    });
    setSaving(p.sha256);
    try {
      const r = await fetch("/api/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ who: who.trim(), sha: p.sha256, action, site, note: extra.note }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error ?? "Not saved");
    } catch (e) {
      setDecisions(before);
      setError(`Not saved: ${(e as Error).message}. Please try again.`);
    } finally {
      setSaving(null);
    }
  }

  const bar = (a: Action, color: string) => (
    <div className={color} style={{ width: `${(count(a) / Math.max(all.length, 1)) * 100}%` }} />
  );

  return (
    <div>
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold leading-tight">Photo review</h1>
              <p className="text-sm text-stone-600">
                {decided} of {all.length} chosen · {count("use")} use · {count("keep_off")} keep off · {count("unsure")} not sure
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-stone-600">Your first name</span>
              <input
                id="who"
                value={who}
                onChange={(e) => saveWho(e.target.value)}
                className="w-32 rounded-md border border-stone-300 px-3 py-2 text-base"
                autoComplete="given-name"
              />
            </label>
          </div>
          <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-stone-200" role="progressbar" aria-valuenow={decided} aria-valuemax={all.length}>
            {bar("use", "bg-emerald-500")}
            {bar("keep_off", "bg-rose-500")}
            {bar("unsure", "bg-amber-400")}
          </div>
          <nav className="-mx-1 mt-3 flex gap-1 overflow-x-auto pb-1" aria-label="Sections">
            {sections.map((s) => {
              const done = s.items.filter((p) => decisions[p.sha256]).length;
              const on = s.key === section?.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setTab(s.key)}
                  aria-pressed={on}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm ${on ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 bg-white"}`}
                >
                  {s.label} <span className={on ? "text-stone-300" : "text-stone-500"}>{done}/{s.items.length}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5">
        {error && (
          <p role="alert" className="mb-4 rounded-md border border-rose-300 bg-rose-50 px-4 py-3 text-rose-800">
            {error}
          </p>
        )}
        {section?.note && <p className="mb-4 max-w-3xl text-stone-700">{section.note}</p>}
        <label className="mb-4 flex items-center gap-2 text-sm text-stone-700">
          <input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} className="size-5" />
          Show only the ones I have not chosen yet
        </label>

        {shown.length === 0 && <p className="rounded-md bg-emerald-50 px-4 py-6 text-emerald-900">Everything in this section has been chosen.</p>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => {
            const d = decisions[p.sha256];
            const st = d ? STATE[d.action as keyof typeof STATE] : null;
            const needsSite = !p.site;
            const chosenSite = d?.site ?? p.site ?? "";
            const kids = p.people === "minors";
            return (
              <article key={p.sha256} className={`overflow-hidden rounded-xl bg-white shadow-sm ${st ? st.ring : "ring-1 ring-stone-200"}`}>
                <button className="relative block w-full bg-stone-200" onClick={() => setOpen(p)} aria-label="See the photo larger">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/thumb/${p.sha256}`} alt={p.scene_text ?? "A photo to review"} loading="lazy" className={`aspect-[4/3] w-full object-contain ${d?.action === "keep_off" ? "opacity-50" : ""}`} />
                  {st && (
                    <span className={`absolute left-2 top-2 flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold shadow ${st.badge}`}>
                      <span aria-hidden>{st.mark}</span>
                      {st.label}
                    </span>
                  )}
                </button>
                <div className="space-y-3 p-3">
                  <div>
                    <p className="text-sm font-semibold">
                      {niceDate(p.taken)}
                      {p.hero && <span className="ml-2 rounded bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">good for a big banner</span>}
                      {kids && <span className="ml-2 rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">children</span>}
                      {p.kind !== "camera" && <span className="ml-2 rounded bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700">small copy</span>}
                    </p>
                    {p.scene_text && <p className="mt-1 text-sm text-stone-700">{p.scene_text}</p>}
                    {p.site && <p className="mt-1 text-xs text-stone-500">Proposed for {SITE_NAMES[p.site]}</p>}
                  </div>

                  {needsSite && (
                    <label className="block text-sm">
                      <span className="text-stone-600">Which business?</span>
                      <select
                        value={chosenSite}
                        onChange={(e) => decide(p, d?.action && d.action !== "clear" ? d.action : "unsure", { site: (e.target.value || null) as Site | null, note: d?.note })}
                        className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2.5 text-base"
                      >
                        <option value="">Choose…</option>
                        {SITES.map((s) => (
                          <option key={s} value={s}>{SITE_NAMES[s]}</option>
                        ))}
                      </select>
                    </label>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    {(["use", "keep_off", "unsure"] as const).map((a) => {
                      const on = d?.action === a;
                      const color = a === "use" ? "bg-emerald-600 text-white border-emerald-600" : a === "keep_off" ? "bg-rose-600 text-white border-rose-600" : "bg-amber-400 text-stone-900 border-amber-400";
                      return (
                        <button
                          key={a}
                          aria-pressed={on}
                          disabled={saving === p.sha256 || (a === "use" && needsSite && !chosenSite)}
                          onClick={() => decide(p, on ? "clear" : a, { site: chosenSite || null, note: d?.note })}
                          className={`min-h-12 rounded-lg border px-2 py-2.5 text-sm font-semibold disabled:opacity-40 ${on ? color : "border-stone-300 bg-white"}`}
                        >
                          {a === "use" ? (kids ? "OK to use" : "Use") : STATE[a].label}
                        </button>
                      );
                    })}
                  </div>

                  {(needsSite || d?.action === "unsure") && (
                    <input
                      defaultValue={d?.note ?? ""}
                      placeholder="A short note (what is this?)"
                      aria-label="A short note"
                      onBlur={(e) => e.target.value !== (d?.note ?? "") && decide(p, d?.action && d.action !== "clear" ? d.action : "unsure", { site: chosenSite || null, note: e.target.value })}
                      className="w-full rounded-md border border-stone-300 px-3 py-2.5 text-base"
                    />
                  )}
                  {d && (
                    <p className="text-xs text-stone-500">
                      {d.who}, {new Date(d.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      {d.note ? ` · “${d.note}”` : ""}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        <p className="mt-8 text-xs text-stone-500">Sorted {new Date(made).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}. Every choice is saved as you tap, with your name and the time.</p>
      </main>

      {open && (
        <div className="fixed inset-0 z-30 flex flex-col bg-black/90 p-4" onClick={() => setOpen(null)} role="dialog" aria-modal="true" aria-label="Photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/thumb/${open.sha256}`} alt={open.scene_text ?? ""} className="min-h-0 flex-1 object-contain" />
          <p className="pt-3 text-center text-white">{niceDate(open.taken)}{open.scene_text ? ` · ${open.scene_text}` : ""} · tap to close</p>
        </div>
      )}
    </div>
  );
}
