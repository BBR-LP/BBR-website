import type { Shot } from "./types";

// The places on a page a photo can fill, by the words Greg and Kristen see in the editing screen
// (bre/shared/photo-journal/001, Part 7). Order here is the order on the page. Boat and Bike use
// all of them; a gallery slot waits for a gallery section in the template.
export const photoSlots = [
  { value: "home-banner", label: "Home banner (wide photo)" },
  { value: "season-1", label: "First season card (tall photo)" },
  { value: "season-2", label: "Second season card (tall photo)" },
  { value: "season-3", label: "Third season card (tall photo)" },
  { value: "story", label: "Story photo (wide)" },
  { value: "share", label: "Picture shown when the page's link is shared (wide)" },
] as const;

export type PhotoSlot = (typeof photoSlots)[number]["value"];

// What a site's photo records look like once read (Keystatic reader, collection "photos").
type PhotoEntry = { file: string | null; alt: string; status: string; slots: readonly string[]; focal: string; shotYear: number | null };
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

// For each slot, the photo to show, or nothing (the page then keeps its stand-in). A record counts only
// when it is approved, has a picture and a description (the description is the alt text), and a person
// chose the slot. Retired photos and photos with no slot never appear. When several records claim one
// slot, the newest year wins, then the name, so the answer doesn't change between page loads.
export function pickPhotos(records: readonly PhotoRecord[]): Partial<Record<PhotoSlot, Shot>> {
  const usable = records
    .filter((r) => r.entry.status === "approved" && r.entry.file && r.entry.alt.trim())
    .sort((a, b) => (b.entry.shotYear ?? 0) - (a.entry.shotYear ?? 0) || a.slug.localeCompare(b.slug));
  const picks: Partial<Record<PhotoSlot, Shot>> = {};
  for (const { value } of photoSlots) {
    const r = usable.find((x) => x.entry.slots.includes(value));
    if (r) picks[value] = { brief: r.entry.alt, alt: r.entry.alt, src: r.entry.file!, focal: r.entry.focal };
  }
  return picks;
}
