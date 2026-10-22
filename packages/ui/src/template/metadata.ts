import type { Metadata } from "next";
import { getRace } from "./runsignup";
import { getSite } from "./registry";
import type { SiteContent, SiteSlug } from "./types";

// Page title and search description for a site. Race sites add the live race date from RunSignUp,
// so the description is never out of date. Held back from search engines until go-live.
export async function siteMetadata(slug: SiteSlug, c: SiteContent, opts: { indexable: boolean }): Promise<Metadata> {
  const site = getSite(slug);
  const race = c.raceId ? await getRace(c.raceId) : null;
  const description = race ? `${site.description} Next race: ${race.date}.` : site.description;
  return {
    metadataBase: new URL(new URL(site.url).origin), // where share images resolve once the site is live there
    title: c.title,
    description,
    openGraph: { title: c.title, description, siteName: site.name, ...((c.shareImage ?? c.hero.photo.src) && { images: [(c.shareImage ?? c.hero.photo.src)!] }) },
    robots: opts.indexable ? undefined : { index: false, follow: false },
  };
}
