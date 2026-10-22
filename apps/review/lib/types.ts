// Names and types shared by the page and the server. No file access in here: the browser imports this.

export const SITES = ["boat", "bike", "run", "mothers-day"] as const;
export type Site = (typeof SITES)[number];
export const SITE_NAMES: Record<Site, string> = {
  boat: "Mirror Lake Boat Rental",
  bike: "Bike Lake Placid",
  run: "Lake Placid Marathon",
  "mothers-day": "Mother's Day 10K",
};

export type Photo = {
  file: string;
  sha256: string;
  site: Site | null;
  taken: string | null;
  kind: "camera" | "copy" | "screenshot";
  people: "none" | "few" | "crowd" | "identifiable" | "minors" | "unknown";
  hero: boolean;
  scene_text: string | null;
  width: number;
  height: number;
  near_duplicate_of: string | null;
  usable: { web: boolean; banner: boolean; copy: boolean };
  reasons: string[];
  conflict: boolean;
};

export type Action = "use" | "keep_off" | "unsure" | "clear";
export type Decision = { at: string; who: string; sha: string; action: Action; site?: Site | null; note?: string; children_ok?: boolean; by?: string };

export type Section = { key: string; label: string; note?: string; items: Photo[] };

// The same grouping as the PDF contact sheet: one row per scene (near-duplicates hidden), originals by
// business, children first, then the unsure ones, then small copies.
export function sections(photos: Photo[]): Section[] {
  const keepers = photos.filter((p) => !p.near_duplicate_of);
  const originals = keepers.filter((p) => p.kind === "camera" && p.usable.web);
  const byDate = (a: Photo, b: Photo) => (a.taken ?? "").localeCompare(b.taken ?? "");
  const out: Section[] = SITES.map((s) => ({
    key: s,
    label: SITE_NAMES[s],
    items: originals.filter((p) => p.site === s && p.people !== "minors").sort(byDate),
  }));
  out.push({
    key: "children",
    label: "Check first (children)",
    note: "These show children. Choosing Use means you are okay with the photo appearing on that business's website.",
    items: originals.filter((p) => p.site && p.people === "minors").sort(byDate),
  });
  out.push({
    key: "unsure",
    label: "Not sure",
    note: "We could not tell which business these belong to, or what they are. Pick a business if you know, or leave a short note.",
    items: keepers.filter((p) => !p.site).sort(byDate),
  });
  out.push({
    key: "copies",
    label: "Small copies",
    note: "These are copies saved from Facebook, WhatsApp or a screenshot, not the originals, so they are small. If the original is on a phone, upload it.",
    items: keepers.filter((p) => p.site && (p.kind === "copy" || p.kind === "screenshot")).sort(byDate),
  });
  return out.filter((s) => s.items.length > 0);
}
