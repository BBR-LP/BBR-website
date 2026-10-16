import { createReader } from "@keystatic/core/reader";
import type { SiteContent } from "@bbr/ui";
import keystaticConfig from "./keystatic.config";

// Bike Lake Placid's page. What the owners change (notice, season, hours, rates, questions, phone,
// story) is read from ./content, edited at /keystatic. Everything else is here and changes through
// turph: page title, main heading and search description (in @bbr/ui), booking link, layout,
// photos, address and email. Facts come from the live site (pulled 2026-10-13,
// bre/bike/research/003-content-inventory.md; hours confirmed by Greg 2026-10-14); headlines are
// draft; photos are stand-ins until the Dropbox sort (bre decision 013).

const reader = createReader(process.cwd(), keystaticConfig);

const photo = (file: string, brief: string) => ({ brief, src: `/photos/${file}.jpg` });

const BOOKING = "https://app.bookingterminal.com/widget/03d00eb6-0a57-11f0-9ccf-2325e9e27d9d/embed/bookables";

const need = <T>(value: T | null, name: string): T => {
  if (value === null) throw new Error(`Missing content/${name}.json; add it or restore it from git history.`);
  return value;
};

// "9am" -> "09:00", "5:30pm" -> "17:30"; anything else -> undefined (the search details then omit hours).
function to24h(text: string): string | undefined {
  const m = text.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (!m) return undefined;
  let h = Number(m[1]) % 12;
  if (m[3].toLowerCase() === "pm") h += 12;
  return `${String(h).padStart(2, "0")}:${m[2] ?? "00"}`;
}

export async function getBikeContent(): Promise<SiteContent> {
  const [notice, season, hours, rates, faq, contact, story] = await Promise.all([
    reader.singletons.notice.read(),
    reader.singletons.season.read(),
    reader.singletons.hours.read(),
    reader.singletons.rates.read(),
    reader.singletons.faq.read(),
    reader.singletons.contact.read(),
    reader.singletons.story.read(),
  ]);
  const s = need(season, "season");
  const h = need(hours, "hours");
  const r = need(rates, "rates");
  const f = need(faq, "faq");
  const st = need(story, "story");

  // Said once, shown everywhere: season and hours appear in the hours box, the booking band and the
  // season question; the rates feed the "from" prices and the search details' price range. A row
  // with a blank price is skipped, so a half-filled row can't put "$null" on the page.
  const rows = r.rows.flatMap((x) =>
    x.twoHours === null || x.fiveHours === null || x.day === null
      ? []
      : [{ name: x.name, electric: x.electric, prices: [x.twoHours, x.fiveHours, x.day] }],
  );
  if (rows.length === 0) throw new Error("content/rates.json has no complete rows.");
  const all = rows.flatMap((x) => x.prices);
  const lowest = (list: typeof rows) => (list.length ? Math.min(...list.map((x) => x.prices[0])) : undefined);
  const fromE = lowest(rows.filter((x) => x.electric));
  const fromR = lowest(rows.filter((x) => !x.electric));
  const from = [fromE !== undefined && `E-bikes from $${fromE}`, fromR !== undefined && `regular bikes from $${fromR}`].filter(Boolean).join(", ");

  const seasonQuestion = {
    q: "When does the season start and end?",
    a: `Rentals start ${s.opens} and run until ${s.closes}. In season we're open every day, ${h.opens} to ${h.closes}, weather permitting.`,
  };
  const questions = f.items.map((i) => ({ q: i.q, a: i.a }));
  questions.splice(Math.min(3, questions.length), 0, seasonQuestion);

  const opens24 = to24h(h.opens);
  const closes24 = to24h(h.closes);

  const seasonPhotos = [
    photo("teal-ebike-on-trail", "An e-bike parked on the rail trail"),
    photo("group-of-friends-ebikes", "Friends and family on e-bikes"),
    photo("couple-on-trail", "A couple and their dog on the trail"),
  ];

  return {
    notice: notice?.message?.trim() || undefined,
    title: "Rail Trail E-Bike Rentals | Bike Lake Placid",
    nav: [{ label: "Rates", href: "#rates" }, { label: "How it works", href: "#story" }, { label: "Find us", href: "#location" }, { label: "Good to know", href: "#good-to-know" }],
    cta: "Book a bike",
    ctaHref: BOOKING,
    hero: {
      photo: photo("cyclist-on-rail-trail", "A rider on the rail trail toward the shop"),
      heading: "Rail trail bike rentals in Lake Placid",
      headline: "The easiest way to see the Adirondacks.",
      line: "E-bikes for the Adirondack Rail Trail, right from our door. Regular bikes too.",
    },
    book: {
      title: "Book your bikes",
      line: `${from ? `${from}. ` : ""}Open every day ${h.opens} to ${h.closes}, from ${s.opens} until ${s.closes}.`,
    },
    seasons: st.seasons.map((x, i) => ({ season: x.season, title: x.title, line: x.line, photo: seasonPhotos[i] })),
    story: { photo: photo("staff-on-shop-steps", "The crew on the shop steps"), title: st.title, body: st.body },
    rates: {
      title: "Rates",
      columns: ["2 hours", "5 hours", "24 hours"],
      rows: rows.map((x) => ({ name: x.name, prices: x.prices.map((p) => `$${p}`) })),
      notes: [...r.notes],
    },
    hours: { title: "Hours", lines: [`Open every day, ${h.opens} to ${h.closes}, weather permitting.`, `From ${s.opens} until ${s.closes}.`] },
    business: {
      url: "https://www.bikelakeplacid.us",
      address: { street: "455 Old Military Rd", city: "Lake Placid", state: "NY", zip: "12946" },
      priceRange: `$${Math.min(...all)}–$${Math.max(...all)}`,
      ...(opens24 && closes24 && { hours: { opens: opens24, closes: closes24 } }),
      sameAs: ["https://www.instagram.com/bikelakeplacid/", "https://www.facebook.com/profile.php?id=61557553976954"],
    },
    location: {
      kind: "facility",
      title: "Find the shop",
      place: { label: "The shop", name: "455 Old Military Rd, Lake Placid, NY 12946", query: "Bike Lake Placid, 455 Old Military Rd, Lake Placid, NY 12946" },
      directions: ["Right on the Adirondack Rail Trail. Drive in, park, pick up your bike and ride straight onto the trail."],
    },
    goodToKnow: questions,
    // The email is not editable (turph, 2026-10-16). The phone is still to be confirmed with Greg and
    // Kristen: the live footer shows 518-354-0777, the site's settings list 518-302-5473 (Clients n-bike-phone).
    contact: { phone: contact?.phone || "518-354-0777", email: "info@bikelakeplacid.us" },
  };
}
