import type { SiteContent } from "./types";

// How many store items a page shows. The store itself has the rest.
export const MERCH_LIMIT = 4;

// What the "Store items on the page" setting looks like once read (Keystatic reader, singleton "merch").
export type MerchSettings = { title: string; shopHref: string; items: readonly { name: string; photo: string | null }[] } | null;

// The setting as page content, or nothing: no store link, or no item with both a name and a photo,
// means no section. An item's name is also its photo's description, since the photo shows that item.
export function merchContent(m: MerchSettings): SiteContent["merch"] | undefined {
  if (!m?.shopHref?.trim()) return undefined;
  const items = m.items
    .flatMap((i) => (i.photo && i.name.trim() ? [{ name: i.name.trim(), photo: { brief: i.name, alt: i.name, src: i.photo } }] : []))
    .slice(0, MERCH_LIMIT);
  return items.length ? { title: m.title.trim() || "From the store", shopHref: m.shopHref, items } : undefined;
}
