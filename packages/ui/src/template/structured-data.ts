import type { SiteInfo } from "./registry";
import type { SiteContent } from "./types";
import type { Race } from "./runsignup";

// Business details for search engines and AI assistants (schema.org JSON-LD), from the same content
// the page shows, so the two can't disagree. Rentals: a local business. Races: one event per
// distance, with the date, start time, place and price read live from RunSignUp.

const tel = (phone: string) => `+1-${phone.replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")}`;
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function structuredData(site: SiteInfo, c: SiteContent, race: Race | null): object[] {
  const b = c.business;
  if (b) {
    return [{
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: site.name,
      description: site.description,
      url: b.url,
      ...((c.shareImage ?? c.hero.photo.src) && { image: `${b.url}${c.shareImage ?? c.hero.photo.src}` }),
      ...(c.contact.phone && { telephone: tel(c.contact.phone) }),
      email: c.contact.email,
      address: { "@type": "PostalAddress", streetAddress: b.address.street, addressLocality: b.address.city, addressRegion: b.address.state, postalCode: b.address.zip, addressCountry: "US" },
      ...(b.geo && { geo: { "@type": "GeoCoordinates", latitude: b.geo.lat, longitude: b.geo.lng } }),
      ...(b.priceRange && { priceRange: b.priceRange }),
      ...(b.hours && { openingHoursSpecification: { "@type": "OpeningHoursSpecification", dayOfWeek: DAYS, opens: b.hours.opens, closes: b.hours.closes } }),
      ...(b.sameAs && { sameAs: b.sameAs }),
    }];
  }
  if (!race) return [];
  const place = {
    "@type": "Place",
    name: c.location.kind === "course" ? c.location.places[0].name : site.name,
    address: { "@type": "PostalAddress", streetAddress: race.address.street, addressLocality: race.address.city, addressRegion: race.address.state, postalCode: race.address.zipcode, addressCountry: "US" },
  };
  return race.events.map((e) => ({
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${site.name}: ${e.name}`,
    description: site.description,
    sport: "Running",
    startDate: e.isoStart,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: place,
    organizer: { "@type": "Organization", name: site.name, email: c.contact.email },
    ...(e.fee && {
      offers: {
        "@type": "Offer",
        price: e.fee.replace(/[^\d.]/g, ""),
        priceCurrency: "USD",
        url: race.url,
        availability: race.open ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      },
    }),
  }));
}

// JSON inside a <script> tag: escape "<" so text can't close the tag early.
export const jsonLd = (data: object[]) => JSON.stringify(data.length === 1 ? data[0] : data).replace(/</g, "\\u003c");
