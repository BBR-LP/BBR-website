import { CurrentYear } from "./CurrentYear";
import { SiteLogo } from "./SiteLogo";
import { typeface } from "./typeface";
import type { SiteInfo } from "./registry";
import type { Race } from "./runsignup";
import type { Brand, Location, Place, RateTable, Shot, SiteContent } from "./types";

// A photo, or until one exists, a colored block with the brief saying what the photo should show.
export function Photo({ shot, from, to, className = "" }: { shot: Shot; from: string; to: string; className?: string }) {
  if (shot.src) return <img src={shot.src} alt={shot.brief} className={`w-full object-cover ${className}`} />;
  return (
    <div className={`flex items-center justify-center p-6 ${className}`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
      <span className="max-w-xs text-center text-xs uppercase tracking-widest text-white/70">Photo to come · {shot.brief}</span>
    </div>
  );
}

type Palette = Brand["color"];
type Heading = ReturnType<typeof typeface>;

export function MainButton({ href, label, color }: { href: string; label: string; color: Palette }) {
  return (
    <a href={href} target="_blank" rel="noopener" className="inline-block rounded-full px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
      style={{ background: color.primary_action, color: color.on_primary }}>{label}</a>
  );
}

// Race date, events, start times and today's entry price, read live from RunSignUp.
export function RaceDay({ race, href, cta, color, heading }: { race: Race | null; href: string; cta: string; color: Palette; heading: Heading }) {
  return (
    <section id="race" className="mx-auto max-w-4xl w-full px-4 pb-24 scroll-mt-20">
      <h2 className="text-center text-sm uppercase tracking-widest" style={{ color: color.neutral_text_muted }}>Race day</h2>
      {race ? (
        <>
          <p className="mt-4 text-center text-3xl sm:text-4xl" style={heading}>{race.date}</p>
          <div className="mt-10 divide-y rounded-lg border" style={{ borderColor: color.neutral_border }}>
            {race.events.map((e) => (
              <div key={e.name} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-5 py-4" style={{ borderColor: color.neutral_border }}>
                <span className="text-lg" style={heading}>{e.name}</span>
                <span style={{ color: color.neutral_text_muted }}>{e.date} · starts {e.start}{e.fee && ` · ${e.fee}`}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-sm" style={{ color: color.neutral_text_muted }}>
            Prices go up closer to race day. A small processing fee is added when you sign up.
          </p>
        </>
      ) : (
        <p className="mt-4 text-center text-lg" style={{ color: color.neutral_text_muted }}>See the date, events and prices on the sign-up page.</p>
      )}
      <div className="mt-8 text-center"><MainButton href={href} label={race && !race.open ? "See the race" : cta} color={color} /></div>
    </section>
  );
}

export function Rates({ rates, hours, href, cta, color, heading }: { rates: RateTable; hours?: { title: string; lines: string[] }; href: string; cta: string; color: Palette; heading: Heading }) {
  return (
    <section id="rates" className="mx-auto max-w-4xl w-full px-4 py-24 scroll-mt-20">
      <h2 className="text-center text-3xl" style={heading}>{rates.title}</h2>
      <div className="mt-10 overflow-x-auto rounded-lg border" style={{ borderColor: color.neutral_border }}>
        <table className="w-full text-left">
          {rates.columns.length > 1 && (
            <thead>
              <tr className="text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest" style={{ color: color.neutral_text_muted }}>
                <th className="px-3 sm:px-5 py-3 font-medium"></th>
                {rates.columns.map((col) => <th key={col} className="px-2 sm:px-5 py-3 font-medium text-right whitespace-nowrap">{col}</th>)}
              </tr>
            </thead>
          )}
          <tbody>
            {rates.rows.map((r) => (
              <tr key={r.name} className="border-t" style={{ borderColor: color.neutral_border }}>
                <td className="px-3 sm:px-5 py-4">{r.name}</td>
                {r.prices.map((p, i) => <td key={i} className="px-2 sm:px-5 py-4 text-right tabular-nums whitespace-nowrap">{p}{rates.columns.length === 1 && <span style={{ color: color.neutral_text_muted }}> / hour</span>}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="mt-4 space-y-1 text-sm" style={{ color: color.neutral_text_muted }}>
        {rates.notes.map((n) => <li key={n}>{n}</li>)}
      </ul>
      {hours && (
        <div className="mt-10 rounded-lg px-5 py-5" style={{ background: color.neutral_bg }}>
          <div className="text-xs uppercase tracking-widest font-medium" style={{ color: color.secondary_text }}>{hours.title}</div>
          {hours.lines.map((l) => <p key={l} className="mt-1">{l}</p>)}
        </div>
      )}
      <div className="mt-8 text-center"><MainButton href={href} label={cta} color={color} /></div>
    </section>
  );
}

// The main button again, right after the hero, for anyone who missed it in the header.
export function BookBand({ book, href, cta, color, dark, onDark, heading }: { book: { title: string; line: string }; href: string; cta: string; color: Palette; dark: string; onDark: string; heading: Heading }) {
  return (
    <section className="mx-auto max-w-6xl w-full px-4 pb-24">
      <div className="rounded-2xl px-6 py-10 sm:px-12 flex flex-col md:flex-row md:items-center justify-between gap-6" style={{ background: dark, color: onDark }}>
        <div>
          <h2 className="text-3xl" style={heading}>{book.title}</h2>
          <p className="mt-2 text-lg opacity-85">{book.line}</p>
        </div>
        <a href={href} target="_blank" rel="noopener" className="self-start md:self-auto shrink-0 rounded-full bg-white px-7 py-3.5 font-medium hover:opacity-90 transition-opacity"
          style={{ color: color.primary_action }}>{cta}</a>
      </div>
    </section>
  );
}

// "Open in Maps" for both phones: Apple Maps opens the Maps app on an iPhone, Google Maps on Android.
export function MapButtons({ place, color }: { place: Place; color: Palette }) {
  const q = encodeURIComponent(place.query);
  const links = [
    { label: "Apple Maps", href: `https://maps.apple.com/?q=${q}` },
    { label: "Google Maps", href: `https://www.google.com/maps/search/?api=1&query=${q}` },
  ];
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {links.map((l) => (
        <a key={l.label} href={l.href} target="_blank" rel="noopener" className="rounded-full border px-4 py-2 text-sm hover:opacity-80 transition-opacity"
          style={{ borderColor: color.neutral_border_strong }}>Open in {l.label}</a>
      ))}
    </div>
  );
}

export function MapEmbed({ place, className = "" }: { place: Place; className?: string }) {
  return (
    <iframe title={`Map: ${place.name}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
      src={`https://www.google.com/maps?q=${encodeURIComponent(place.query)}&output=embed`}
      className={`w-full rounded-lg border-0 ${className}`} />
  );
}

// Rentals: find the shop or dock. Races: the course, starting with where it starts.
export function LocationSection({ location, color, heading }: { location: Location; color: Palette; heading: Heading }) {
  const label = (text: string) => <div className="text-xs uppercase tracking-widest font-medium" style={{ color: color.secondary_text }}>{text}</div>;
  return (
    <section id="location" className="mx-auto max-w-6xl w-full px-4 py-24 scroll-mt-20">
      <h2 className="text-center text-3xl" style={heading}>{location.title}</h2>
      {location.kind === "facility" ? (
        <div className="mt-10 grid gap-8 md:grid-cols-2 md:items-center">
          <MapEmbed place={location.place} className="aspect-[4/3]" />
          <div>
            {label(location.place.label)}
            <p className="mt-1 text-xl" style={heading}>{location.place.name}</p>
            {location.directions.map((d) => <p key={d} className="mt-3" style={{ color: color.neutral_text_muted }}>{d}</p>)}
            <MapButtons place={location.place} color={color} />
          </div>
        </div>
      ) : (
        <>
          <p className="mx-auto mt-6 max-w-3xl text-center text-lg leading-relaxed" style={{ color: color.neutral_text_muted }}>{location.intro}</p>
          <div className="mt-12 grid gap-8 md:grid-cols-2 md:items-start">
            <MapEmbed place={location.places[0]} className="aspect-[4/3]" />
            <div>
              {location.places.map((p) => (
                <div key={p.label} className="mb-6">
                  {label(p.label)}
                  <p className="mt-1 text-xl" style={heading}>{p.name}</p>
                  <MapButtons place={p} color={color} />
                </div>
              ))}
              <ul className="space-y-2" style={{ color: color.neutral_text_muted }}>
                {location.details.map((d) => <li key={d}>{d}</li>)}
              </ul>
            </div>
          </div>
          <div className={`mt-12 grid gap-6 ${location.maps.length > 1 ? "sm:grid-cols-3" : "max-w-sm mx-auto"}`}>
            {location.maps.map((m) => (
              <a key={m.src} href={m.src} target="_blank" rel="noopener" className="group block">
                <img src={m.src} alt={`${m.label} course map`} className="w-full rounded-lg border" style={{ borderColor: color.neutral_border }} />
                <span className="mt-2 block text-center text-sm group-hover:underline" style={{ color: color.neutral_text_muted }}>{m.label} course map (tap to enlarge)</span>
              </a>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// Questions per site: Kristen's own (five per site, arriving) plus stand-ins built from facts on the live sites.
export function GoodToKnow({ items, color, heading }: { items: { q: string; a: string }[]; color: Palette; heading: Heading }) {
  return (
    <section id="good-to-know" className="scroll-mt-20" style={{ background: color.neutral_bg }}>
      <div className="mx-auto max-w-3xl px-4 py-24">
        <h2 className="text-center text-3xl" style={heading}>Good to know</h2>
        <div className="mt-10 divide-y" style={{ borderColor: color.neutral_border }}>
          {items.map((i) => (
            <details key={i.q} className="group py-5" style={{ borderColor: color.neutral_border }}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg">
                {i.q}<span aria-hidden className="text-2xl transition-transform group-open:rotate-45" style={{ color: color.neutral_text_muted }}>+</span>
              </summary>
              <p className="mt-3" style={{ color: color.neutral_text_muted }}>{i.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// `color` is the page's own palette: the card sits on this site's page, showing another site's logo.
export function SisterSite({ site, color }: { site: SiteInfo; color: Palette }) {
  return (
    <a href={site.url}
      className="flex flex-col items-center gap-4 rounded-lg border p-8 transition-colors hover:border-[var(--hover)]"
      style={{ borderColor: color.neutral_border, ["--hover" as string]: color.neutral_border_strong }}>
      <div className="h-16 flex items-center rounded px-2" style={site.logoOnDark ? { background: site.brand.color.brand_primary } : undefined}>
        <SiteLogo site={site} className="max-h-14 object-contain" />
      </div>
      {site.logo && <span className="text-sm font-medium">{site.name}</span>}
      {/* The other site's own search description, reused whole (turph, 2026-10-14): no separate card copy. */}
      <p className="text-center text-sm leading-relaxed" style={{ color: color.neutral_text_muted }}>{site.description}</p>
    </a>
  );
}

// Contact on a solid background, each item a big tap target that does the thing:
// call, open the map, or start an email.
export function Footer({ site, contact, address, dark }: { site: SiteInfo; contact: SiteContent["contact"]; address?: string; dark: string }) {
  const actions = [
    contact.phone && { label: "Call", value: contact.phone, href: `tel:+1${contact.phone.replace(/\D/g, "")}` },
    address && { label: "Directions", value: address, href: `https://maps.google.com/?q=${encodeURIComponent(address)}` },
    { label: "Email", value: contact.email, href: `mailto:${contact.email}` },
  ].filter((a): a is { label: string; value: string; href: string } => Boolean(a));

  return (
    <footer id="visit" className="mt-auto scroll-mt-20" style={{ background: dark, color: site.brand.color.brand_on_dark }}>
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-3 sm:grid-cols-3">
          {actions.map((a) => (
            <a key={a.label} href={a.href}
              className="flex min-h-16 flex-col justify-center rounded-lg bg-white/10 px-5 py-4 hover:bg-white/15 transition-colors">
              <span className="text-xs uppercase tracking-widest opacity-70">{a.label}</span>
              <span className="mt-1 break-words">{a.value}</span>
            </a>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-x-6 text-sm opacity-70">
          <span>© <CurrentYear /> {site.name}</span>
          {/* The owners' way into the editing screen, so nobody needs a bookmark (turph, 2026-10-16). Every
              template site has one at /keystatic. Not followed by crawlers; leave it out of click tracking. */}
          <a href="/keystatic" rel="nofollow" data-untracked className="inline-block py-2 underline underline-offset-4 hover:opacity-100">Staff login</a>
        </div>
      </div>
    </footer>
  );
}

// One short line across the very top: opening and closing news, a weather closure. Set by the
// owners in the editing screen; empty means nothing is shown.
export function NoticeBar({ message, color }: { message: string; color: Palette }) {
  return (
    <div role="status" className="px-4 py-3 text-center text-sm font-medium" style={{ background: color.brand_dark, color: color.brand_on_dark }}>
      {message}
    </div>
  );
}
