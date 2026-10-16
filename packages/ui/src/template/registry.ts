import bike from "../brands/bike.json";
import boat from "../brands/boat.json";
import run from "../brands/run.json";
import mothersDay from "../brands/mothers-day.json";
import bikeLogo from "../logos/bike-logo.png";
import boatLogoWhite from "../logos/boat-logo-white.svg";
import runLogo from "../logos/run-logo.svg";
import type { Brand, SiteSlug } from "./types";

// The four sites, in one place: used for each site's own page and for the "More ways to spend a day
// in Lake Placid" cards and menu on the others. `description` is the page's search description AND
// the text on its card elsewhere (reused whole, turph 2026-10-14), so it has a single source.
export type SiteInfo = {
  slug: SiteSlug;
  name: string;
  url: string; // the live address the cards link to
  logo: string | null; // null: no logo yet, the name is set in the brand's heading font
  logoOnDark: boolean; // white logo, shown on the brand color
  brand: Brand;
  description: string;
};

export const sites: SiteInfo[] = [
  {
    slug: "boat",
    name: "Mirror Lake Boat Rental",
    url: "https://www.mlboatrental.com/",
    logo: boatLogoWhite.src,
    logoOnDark: true,
    brand: boat,
    description: "Kayaks, paddle boards, canoes, sailboats and electric boats on Mirror Lake, off Main Street in Lake Placid. Open daily until dark. Walk up or book online.",
  },
  {
    slug: "bike",
    name: "Bike Lake Placid",
    url: "https://www.bikelakeplacid.us/",
    logo: bikeLogo.src,
    logoOnDark: false,
    brand: bike,
    // Hours confirmed by Greg 2026-10-14: until 5, season from snow-off-the-trail to about Halloween.
    description: "E-bike rentals right on the Adirondack Rail Trail in Lake Placid. Drive in, park and ride. Helmets and locks included. Open daily 9 to 5. Book online.",
  },
  {
    slug: "run",
    name: "Lake Placid Marathon",
    url: "https://lakeplacidmarathon.com/",
    logo: runLogo.src,
    logoOnDark: false,
    brand: run,
    // Draft: Run's wording is on hold until settled with Greg and Kristen (Clients #60).
    description: "Run the Lake Placid Marathon, Half Marathon or 10K past the Olympic sites of Lake Placid, NY. A certified course and Boston Marathon qualifier. See the race day, prices and course, and register online.",
  },
  {
    slug: "mothers-day",
    name: "Mother's Day 10K",
    url: "https://lakeplacidmarathon.com/mothers-day-10k/",
    logo: null,
    logoOnDark: false,
    brand: mothersDay,
    description: "A 10K and a 5K you can run with your dog or stroller, on the Adirondack Rail Trail in Lake Placid, NY, the Saturday before Mother's Day. See the race day and prices, and register online.",
  },
];

export function getSite(slug: SiteSlug) {
  const s = sites.find((x) => x.slug === slug);
  if (!s) throw new Error(`Unknown site: ${slug}`);
  return s;
}
