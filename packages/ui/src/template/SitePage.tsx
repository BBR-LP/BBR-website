import { SiteHeader } from "./SiteHeader";
import { getRace } from "./runsignup";
import { getSite, sites } from "./registry";
import { jsonLd, structuredData } from "./structured-data";
import { typeface } from "./typeface";
import { BookBand, Footer, GoodToKnow, LocationSection, Photo, RaceDay, Rates, SisterSite } from "./sections";
import type { SiteContent, SiteSlug } from "./types";

// The shared page template (bre/shared/design-journal/001 and 005): words never sit on photos, a
// solid header (Menu, centered logo, one main button), the main button again right after the hero,
// story before selling, a location section, and a footer made for thumbs.
export async function SitePage({ slug, content: c }: { slug: SiteSlug; content: SiteContent }) {
  const site = getSite(slug);
  const { color } = site.brand;
  const dark = color.brand_dark;
  const heading = typeface(site.brand, "heading");
  const others = sites.filter((s) => s.slug !== slug);
  const race = c.raceId ? await getRace(c.raceId) : null;

  return (
    <div id="top" className="flex-1 flex flex-col" style={{ ...typeface(site.brand, "body"), fontSize: "1.0625rem", background: color.neutral_surface, color: color.neutral_text }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData(site, c, race)) }} />
      <SiteHeader site={site} nav={c.nav} cta={c.cta} ctaHref={c.ctaHref} others={others} />

      <Photo shot={c.hero.photo} from={color.brand_primary} to={dark} className="h-[60vh] min-h-80" />

      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-xs sm:text-sm uppercase tracking-widest font-medium" style={{ color: color.secondary_text }}>{c.hero.heading}</h1>
        <p className="mt-4 text-4xl sm:text-5xl leading-tight" style={heading}>{c.hero.headline}</p>
        <p className="mt-5 text-lg" style={{ color: color.neutral_text_muted }}>{c.hero.line}</p>
      </section>

      {c.raceId && <RaceDay race={race} href={c.ctaHref} cta={c.cta} color={color} heading={heading} />}
      {c.book && <BookBand book={c.book} href={c.ctaHref} cta={c.cta} color={color} dark={dark} onDark={color.brand_on_dark} heading={heading} />}

      <section id="seasons" className="mx-auto max-w-6xl w-full px-4 pb-24 scroll-mt-20">
        <h2 className="text-center text-sm uppercase tracking-widest" style={{ color: color.neutral_text_muted }}>Through the seasons</h2>
        <div className="mt-10 grid gap-10 md:grid-cols-3">
          {c.seasons.map((s) => (
            <div key={s.title}>
              <Photo shot={s.photo} from={color.brand_primary} to={dark} className="aspect-[4/5]" />
              <div className="mt-5 text-xs uppercase tracking-widest font-medium" style={{ color: color.secondary_text }}>{s.season}</div>
              <h3 className="mt-1 text-2xl" style={heading}>{s.title}</h3>
              <p className="mt-2" style={{ color: color.neutral_text_muted }}>{s.line}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="story" className="scroll-mt-20" style={{ background: color.neutral_bg }}>
        <div className="mx-auto max-w-6xl px-4 py-24 grid gap-10 md:grid-cols-2 md:items-center">
          <Photo shot={c.story.photo} from={color.brand_primary} to={dark} className="aspect-[4/3]" />
          <div className="md:pl-6">
            <h2 className="text-3xl" style={heading}>{c.story.title}</h2>
            <p className="mt-4 text-lg leading-relaxed" style={{ color: color.neutral_text_muted }}>{c.story.body}</p>
          </div>
        </div>
      </section>

      {c.rates && <Rates rates={c.rates} hours={c.hours} href={c.ctaHref} cta={c.cta} color={color} heading={heading} />}
      <LocationSection location={c.location} color={color} heading={heading} />
      <GoodToKnow items={c.goodToKnow} color={color} heading={heading} />

      <section className="mx-auto max-w-6xl w-full px-4 py-24">
        <h2 className="text-center text-sm uppercase tracking-widest" style={{ color: color.neutral_text_muted }}>More ways to spend a day in Lake Placid</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {others.map((o) => <SisterSite key={o.slug} site={o} color={color} />)}
        </div>
      </section>

      <Footer site={site} contact={c.contact} address={c.business && `${c.business.address.street}, ${c.business.address.city}, ${c.business.address.state} ${c.business.address.zip}`} dark={dark} />
    </div>
  );
}
