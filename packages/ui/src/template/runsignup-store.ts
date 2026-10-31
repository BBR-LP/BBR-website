// A race's store items, read from its public RunSignUp store page (bre/shared/merch-journal/001).
// RunSignUp's API has no catalogue read for race stores (checked 2026-10-31: the documented store
// methods return purchases only; a race key may unlock more, untested), so the page itself is the
// source: one HTML page per race listing every item with its name, price, picture and options.
// This reads what the store shows, within an hour, with no key. It is a parse of RunSignUp's
// markup, so it is guarded: anything unexpected yields null, and the page shows no merch rather
// than a broken section. If RunSignUp changes the page, the section disappears until this is
// updated; it does not show wrong items.
//
// Anchors in the markup (both stores, 2026-10-31): one `rsuTile` block per item holding
// `<img src="…gen_store_item_<id>…" alt="View a larger image of <name>">`, then an `<h2>` with
// "<name> &mdash; $<price>", then the options and the shipping line.

export type StoreItem = {
  id: number; // RunSignUp's store item id, from the picture's file name
  name: string;
  price: string; // "$21.14"
  image: string; // 200 px picture
  imageFull?: string; // the larger picture, when the page offers one
  soldOut: boolean; // every option sold out, or the item marked sold out
};

// The store page's address: the race's registration address with /Store/ inserted
// (https://runsignup.com/Race/NY/LakePlacid/X -> https://runsignup.com/Race/Store/NY/LakePlacid/X).
export function storeUrl(raceUrl: string): string | null {
  const m = raceUrl.match(/^(https:\/\/runsignup\.com)\/Race\/(.+)$/);
  return m ? `${m[1]}/Race/Store/${m[2]}` : null;
}

const unescape = (s: string) =>
  s.replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&mdash;/g, "—").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").trim();

// The items on a store page, in the store's own order (the owners order them in RunSignUp), or null
// when the page isn't a store page we understand. An empty store gives [].
export function parseStore(html: string): StoreItem[] | null {
  const start = html.indexOf('id="storeFrontForm"');
  if (start < 0) return null;
  const form = html.slice(start, html.indexOf("</form>", start));
  const tiles = form.split('<div class="rsuTile ').slice(1);
  const items: StoreItem[] = [];
  for (const t of tiles) {
    const img = t.match(/<img src="(https:\/\/[^"]*gen_store_item_(\d+)[^"]*)" alt="View a larger image of ([^"]*)"/);
    const h2 = t.match(/<h2[^>]*>\s*([^<]*?)\s*&mdash;\s*\$([\d.]+)/);
    if (!img || !h2) return null; // not the markup this reader knows
    const full = t.match(/races\\\/(gen_store_item_\d+\.[A-Za-z0-9-]+_full\.\w+)/);
    const options = [...t.matchAll(/<option[^>]*>([^<]*)<\/option>/g)].map((m) => m[1]).filter((o) => !/^\s*(option|0)?\s*$/i.test(o));
    const soldOut = options.length > 0 ? options.every((o) => /sold out/i.test(o)) : /sold out/i.test(t);
    items.push({
      id: Number(img[2]),
      name: unescape(img[3]) || unescape(h2[1]),
      price: `$${h2[2]}`,
      image: img[1],
      imageFull: full ? `https://d368g9lw5ileu7.cloudfront.net/races/${full[1]}` : undefined,
      soldOut,
    });
  }
  return items;
}

// The race's store items, or null when the store can't be read (no store, page changed, network).
// Cached an hour by Next, like the race details in runsignup.ts.
export async function getStoreItems(raceUrl: string): Promise<StoreItem[] | null> {
  const url = storeUrl(raceUrl);
  if (!url) return null;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 }, headers: { accept: "text/html" } });
    if (!res.ok) return null;
    return parseStore(await res.text());
  } catch {
    return null;
  }
}
