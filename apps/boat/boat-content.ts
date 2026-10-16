import type { SiteContent } from "@bbr/ui";

// Mirror Lake Boat Rental's page: words, prices, hours, photos and details. Facts come from the live
// site (pulled 2026-10-13, bre/boat/research/003-content-inventory.md). The page title and search
// description are in @bbr/ui (registry); headlines are draft. Photos are stand-ins from the live
// site until the Dropbox sort (bre decision 013).

const photo = (file: string, brief: string) => ({ brief, src: `/photos/${file}.jpg` });

const BOOKING = "https://app.bookingterminal.com/widget/03d00bfa-0a57-11f0-9ccf-d3d3ba1df29a/embed/bookables";

export const boat: SiteContent = {
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
  book: { title: "Get out on the water", line: "Boats from $33 an hour. No reservation needed: walk down to the dock, or book ahead to pay by card." },
  seasons: [
    { season: "Early summer", title: "Quiet mornings", line: "Calm water and the park to yourself before the town wakes up.", photo: photo("attachment-8-wide", "The lakeside park by the dock") },
    { season: "High summer", title: "Pick your boat", line: "Kayaks, paddle boards, hydro bikes and more, all at the dock.", photo: photo("attachment-8-portrait", "The dock lined with kayaks and paddle boats") },
    { season: "Fall", title: "Color on the water", line: "Open until mid-October, when the hills turn.", photo: photo("phone-photo-20221030", "The dock in fall light, still water") },
  ],
  story: {
    photo: photo("attachment-9-wide", "The lawn and dock next to Brewster Park"),
    title: "Right in town, right on the water",
    body: "Park once, walk down to the water, and be on the lake in minutes. We'll get you set up in the right boat and send you off.",
  },
  rates: {
    title: "Prices",
    columns: ["Per hour"],
    rows: [
      { name: "Kayaks (1 and 2 person)", prices: ["$33"] },
      { name: "Canoes", prices: ["$33"] },
      { name: "Stand-up paddle boards", prices: ["$33"] },
      { name: "Row boats", prices: ["$33"] },
      { name: "Paddle boats", prices: ["$33"] },
      { name: "Hydro bikes", prices: ["$33"] },
      { name: "Sail boat", prices: ["$58"] },
      { name: "Electric boats", prices: ["$58"] },
    ],
    notes: ["Cash prices.", "Boats are for 1 or 2 people. A third person is $10 an hour more."],
  },
  hours: { title: "Hours", lines: ["Open every day, 10am until dark, weather permitting.", "From ice-out until mid-October."] },
  business: {
    url: "https://www.mlboatrental.com",
    address: { street: "2403 Main St", city: "Lake Placid", state: "NY", zip: "12946" },
    geo: { lat: 44.2914231, lng: -73.9846079 }, // from the current site's map pin
    priceRange: "$33–$58 per hour",
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
  // Boat keeps its own FAQ, word for word from mlboatrental.com/gifts (Greg, 2026-10-14), except the
  // "first born" answer, which Greg asked to drop. The late-return question is replaced by a plain
  // one (turph, 2026-10-14) drawn from the rental agreement (terms 2 and 7); Greg to confirm the wording.
  goodToKnow: [
    { q: "What's with the lake?", a: "Huh?" },
    { q: "Is this Lake Placid?", a: "Yes." },
    { q: "Then why does it say Mirror Lake Boat Rental?", a: "Huh?" },
    { q: "When is the boat rental season?", a: "We open when the ice is off the lake and stay open until mid-October. In season we're open every day, 10am until dark, weather permitting." },
    { q: "What if I return a boat late?", a: "Please bring your boat back by the end of your rental time, and always before dark. If you're late, you pay for another hour. If we have to come out and bring you in, there is a $50 rescue and recovery fee." },
    { q: "But I don't have a watch!", a: "Start counting......NOW!" },
    { q: "Are there fish in the lake?", a: "Several species. Most abundant are the Snarp, Cow-fish and the bottom dweller, Hummerfish (good eating that one)." },
    { q: "Does my baby / child / teen count as an additional person?", a: "According to Dr. Spock, these kinds of questions can severely affect a child's developmental growth and psyche. You are, in fact, questioning their role as a separate entity. Is this really worth saving the $10 additional person fee?" },
    { q: "How deep is the lake?", a: "Deep. However, more importantly, \"How deep is your love\"? (our apologies to the brothers Gibb)" },
    { q: "Can I hang out on the dock while my friend / child / spouse/ parent/ dog is out on the boat?", a: "Of course not." },
    { q: "Where's the alligator?", a: "Betty White ate it. If we could only get rid of Bea Arthur in the same manner." },
  ],
  contact: { phone: "518-524-7890", email: "info@MLBoatRental.com" },

};
