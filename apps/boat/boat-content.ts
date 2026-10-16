import { createReader } from "@keystatic/core/reader";
import type { SiteContent } from "@bbr/ui";
import keystaticConfig from "./keystatic.config";

// Mirror Lake Boat Rental's page. What the owners change (notice, season, hours, prices, questions,
// phone, story) is read from ./content, edited at /keystatic. Everything else is here and changes
// through turph: the page title and heading and search description (in @bbr/ui), booking link,
// layout, photos, address and email. Facts come from the live site (pulled 2026-10-13,
// bre/boat/research/003-content-inventory.md); headlines are draft; photos are stand-ins until the
// Dropbox sort (bre decision 013).

const reader = createReader(process.cwd(), keystaticConfig);

const photo = (file: string, brief: string) => ({ brief, src: `/photos/${file}.jpg` });

const BOOKING = "https://app.bookingterminal.com/widget/03d00bfa-0a57-11f0-9ccf-d3d3ba1df29a/embed/bookables";

const need = <T>(value: T | null, name: string): T => {
  if (value === null) throw new Error(`Missing content/${name}.json; add it or restore it from git history.`);
  return value;
};

export async function getBoatContent(): Promise<SiteContent> {
  const [notice, season, hours, prices, faq, contact, story] = await Promise.all([
    reader.singletons.notice.read(),
    reader.singletons.season.read(),
    reader.singletons.hours.read(),
    reader.singletons.prices.read(),
    reader.singletons.faq.read(),
    reader.singletons.contact.read(),
    reader.singletons.story.read(),
  ]);
  const s = need(season, "season");
  const h = need(hours, "hours");
  const p = need(prices, "prices");
  const f = need(faq, "faq");
  const st = need(story, "story");

  // Said once, shown everywhere: the season and hours appear in the hours box and the season question,
  // and the lowest and highest prices feed the booking band and the search details.
  // A row without a price is skipped, so a half-filled row can't put "$null" on the page.
  const rows = p.rows.flatMap((r) => (r.price === null ? [] : [{ name: r.name, price: r.price }]));
  if (rows.length === 0) throw new Error("content/prices.json has no priced boats.");
  const amounts = rows.map((r) => r.price);
  const low = Math.min(...amounts);
  const high = Math.max(...amounts);
  const seasonQuestion = {
    q: "When is the boat rental season?",
    a: `We open ${s.opens} and stay open until ${s.closes}. In season we're open every day, ${h.daily}, weather permitting.`,
  };
  const questions = f.items.map((i) => ({ q: i.q, a: i.a }));
  questions.splice(Math.min(3, questions.length), 0, seasonQuestion);

  const seasonPhotos = [
    photo("attachment-8-wide", "The lakeside park by the dock"),
    photo("attachment-8-portrait", "The dock lined with kayaks and paddle boats"),
    photo("phone-photo-20221030", "The dock in fall light, still water"),
  ];

  return {
    notice: notice?.message?.trim() || undefined,
    title: "Boat Rentals on Main Street, Lake Placid | Mirror Lake Boat Rental",
    nav: [{ label: "Prices", href: "#rates" }, { label: "Our dock", href: "#story" }, { label: "Find us", href: "#location" }, { label: "Good to know", href: "#good-to-know" }],
    cta: "Reserve a boat",
    ctaHref: BOOKING,
    hero: {
      photo: photo("lake-landscape", "Mirror Lake and the High Peaks, paddlers out"),
      heading: "Mirror Lake boat rentals on Main Street",
      headline: "The calmest hour on Mirror Lake.",
      line: "Kayaks, canoes, paddle boards, row boats, sail and electric boats, steps from Main Street.",
    },
    book: { title: "Get out on the water", line: `Boats from $${low} an hour. No reservation needed: walk down to the dock, or book ahead to pay by card.` },
    seasons: st.seasons.map((x, i) => ({ season: x.season, title: x.title, line: x.line, photo: seasonPhotos[i] })),
    story: { photo: photo("attachment-9-wide", "The lawn and dock next to Brewster Park"), title: st.title, body: st.body },
    rates: {
      title: "Prices",
      columns: ["Per hour"],
      rows: rows.map((r) => ({ name: r.name, prices: [`$${r.price}`] })),
      notes: [...p.notes],
    },
    hours: { title: "Hours", lines: [`Open every day, ${h.daily}, weather permitting.`, `From ${s.opens} until ${s.closes}.`] },
    business: {
      url: "https://www.mlboatrental.com",
      address: { street: "2403 Main St", city: "Lake Placid", state: "NY", zip: "12946" },
      geo: { lat: 44.2914231, lng: -73.9846079 }, // from the current site's map pin
      priceRange: low === high ? `$${low} per hour` : `$${low}–$${high} per hour`,
      sameAs: ["https://www.instagram.com/mirrorlake_boatrental/", "https://www.facebook.com/MLBoatRental/"],
    },
    location: {
      kind: "facility",
      title: "Find the dock",
      place: { label: "The dock", name: "2403 Main St, Lake Placid, NY 12946", query: "Mirror Lake Boat Rental, 2403 Main St, Lake Placid, NY 12946" },
      directions: [
        "Mirror Lake is the lake right on Main Street, in the middle of the village of Lake Placid.",
        "We're at the north end of Main Street, next to Brewster Park and just behind Player's Bar & Grill.",
        "Follow the path down to the water and you'll see our dock and boats.",
      ],
    },
    goodToKnow: questions,
    // The email is not editable (turph, 2026-10-16): it stays here.
    contact: { phone: contact?.phone || "518-524-7890", email: "info@MLBoatRental.com" },
  };
}
