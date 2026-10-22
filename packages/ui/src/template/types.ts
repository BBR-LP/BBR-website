import bike from "../brands/bike.json";
import boat from "../brands/boat.json";
import run from "../brands/run.json";
import mothersDay from "../brands/mothers-day.json";

// Brand tokens per site. Source of truth: bre/{site}/assets/brand-tokens.json (copied into
// ../brands; re-copy when they change).
export type Brand = typeof bike | typeof boat | typeof run | typeof mothersDay;
export type SiteSlug = "bike" | "boat" | "run" | "mothers-day";

export type NavItem = { label: string; href: string };

// A photo, or until one exists, a colored block that says what the photo should show.
// alt and focal come from a photo record (alt: what it shows; focal: which part to keep when cropped).
export type Shot = { brief: string; src?: string; alt?: string; focal?: string };

export type Season = { season: string; title: string; line: string; photo: Shot };

export type RateTable = {
  title: string;
  intro?: string;
  columns: string[]; // header for each price column
  rows: { name: string; prices: string[] }[];
  notes: string[];
};

// Where to go. Rentals: the shop or dock. Races: the course, starting with where it starts.
export type Place = { label: string; name: string; query: string }; // query: what the map searches for
export type Location =
  | { kind: "facility"; title: string; place: Place; directions: string[] }
  | { kind: "course"; title: string; intro: string; places: Place[]; details: string[]; maps: { label: string; src: string }[] };

// For search engines. Visitors standing on Main Street look at Mirror Lake but call it Lake Placid,
// and search for "Lake Placid", so every title and description names the town; the main heading
// can place the business another way (bre/shared/seo-journal/001).
export type PostalAddress = { street: string; city: string; state: string; zip: string };
export type Business = {
  url: string; // the live domain
  address: PostalAddress;
  geo?: { lat: number; lng: number };
  priceRange?: string;
  hours?: { opens: string; closes: string }; // every day
  sameAs?: string[]; // social accounts
};

// One site's page. Words, prices, hours, photos and details; the shared template does the rest.
// The search description lives in the site registry (it is also what the other sites' cards show).
export type SiteContent = {
  notice?: string; // one short line across the top (opening or closing news, a weather closure); empty = nothing shown
  title: string; // page title (the blue link in Google)
  nav: NavItem[]; // the Menu panel: a few sections of this page
  cta: string;
  ctaHref: string; // booking or registration page
  shareImage?: string; // picture shown when the page is shared; the hero photo when none is chosen
  hero: { photo: Shot; heading: string; headline: string; line: string }; // heading: the one main heading, with the search words
  book?: { title: string; line: string }; // the main-button section right after the hero (rentals; races use raceId)
  seasons: Season[];
  story: { photo: Shot; title: string; body: string };
  gallery?: { title: string; photos: Shot[] }; // a swipeable row of up to 7 photos after the story; not shown when there are none
  rates?: RateTable;
  hours?: { title: string; lines: string[] };
  raceId?: number; // RunSignUp race: date, events, start times and prices are read live, shown right after the hero
  business?: Business; // rentals: marked up for search engines as a local business (races use RunSignUp)
  location: Location;
  goodToKnow: { q: string; a: string }[];
  contact: { phone?: string; email: string }; // the footer's address comes from `business`
};
