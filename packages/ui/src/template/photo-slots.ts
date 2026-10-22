import type { Shot } from "./types";

// The places on a page a photo can fill, by the words Greg and Kristen see in the editing screen
// (bre/shared/photo-journal/001, Part 7). Order here is the order on the page. Boat and Bike use
// all of them. Every slot holds one photo except the gallery, which holds up to GALLERY_LIMIT.
export const photoSlots = [
  { value: "home-banner", label: "Home banner (wide photo)" },
  { value: "season-1", label: "First season card (tall photo)" },
  { value: "season-2", label: "Second season card (tall photo)" },
  { value: "season-3", label: "Third season card (tall photo)" },
  { value: "story", label: "Story photo (wide)" },
  { value: "gallery", label: "Gallery (the newest 7 ticked are shown)" },
  { value: "share", label: "Picture shown when the page's link is shared (wide)" },
] as const;

export type PhotoSlot = (typeof photoSlots)[number]["value"];
export const GALLERY_LIMIT = 7;

// What a site's photo records look like once read (Keystatic reader, collection "photos").
type PhotoEntry = { file: string | null; alt: string; status: string; slots: readonly string[]; focal: string; shotYear: string | null };
type PhotoRecord = { slug: string; entry: PhotoEntry };

// Every readable record, skipping any that isn't valid (say, a photo whose description is still empty).
// Keystatic's own `all()` throws on the first bad record, which would turn the whole page into an error
// for the sake of one photo; here the bad one is left out, noted in the server log, and the rest still show.
export async function readPhotoRecords(photos: { list(): Promise<string[]>; read(slug: string): Promise<PhotoEntry | null> }): Promise<PhotoRecord[]> {
  const records: PhotoRecord[] = [];
  for (const slug of await photos.list()) {
    try {
      const entry = await photos.read(slug);
      if (entry) records.push({ slug, entry });
    } catch (e) {
      console.warn(`Photo record "${slug}" skipped: ${e instanceof Error ? e.message.split("\n").slice(0, 2).join(" ") : e}`);
    }
  }
  return records;
}

// A record counts only when it is approved, has a picture and a description (the description is the
// alt text), and a person chose a slot for it. Retired photos and photos with no slot never appear.
// Newest year first, then the name, so the answer doesn't change between page loads. A year that
// isn't a number ("Older or not known") sorts last.
function usable(records: readonly PhotoRecord[]) {
  return records
    .filter((r) => r.entry.status === "approved" && r.entry.file && r.entry.alt.trim())
    .sort((a, b) => (Number(b.entry.shotYear) || 0) - (Number(a.entry.shotYear) || 0) || a.slug.localeCompare(b.slug));
}

const shot = (r: PhotoRecord): Shot => ({ brief: r.entry.alt, alt: r.entry.alt, src: r.entry.file!, focal: r.entry.focal });

// For each single-photo slot, the photo to show, or nothing (the page then keeps its stand-in). When
// several records claim one slot, the first in the order above wins.
export function pickPhotos(records: readonly PhotoRecord[]): Partial<Record<Exclude<PhotoSlot, "gallery">, Shot>> {
  const ok = usable(records);
  const picks: Partial<Record<Exclude<PhotoSlot, "gallery">, Shot>> = {};
  for (const { value } of photoSlots) {
    if (value === "gallery") continue;
    const r = ok.find((x) => x.entry.slots.includes(value));
    if (r) picks[value] = shot(r);
  }
  return picks;
}

// The gallery: the newest GALLERY_LIMIT photos a person ticked for it. No stand-ins; none ticked, no gallery.
export function pickGallery(records: readonly PhotoRecord[]): Shot[] {
  return usable(records).filter((r) => r.entry.slots.includes("gallery")).slice(0, GALLERY_LIMIT).map(shot);
}
