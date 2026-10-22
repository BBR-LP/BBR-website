import type { Metadata } from "next";
import { SiteLogo } from "../template/SiteLogo";
import { getSite } from "../template/registry";
import { typeface } from "../template/typeface";
import type { SiteSlug } from "../template/types";
import { UploadForm } from "./UploadForm";
import { sourceFrom } from "./rules";

// The photo upload page, /photos on each site. Public on purpose (a sticker on a kayak is visible to everyone), kept
// out of search results, and plain: logo, a few words, the form. Paused, it says so and shows no form.
export const uploadMetadata = (slug: SiteSlug): Metadata => ({ title: `Share your photos | ${getSite(slug).name}`, robots: { index: false, follow: false } });

export function UploadPage({ slug, open, source }: { slug: SiteSlug; open: boolean; source?: string }) {
  const site = getSite(slug);
  const { color } = site.brand;
  const heading = typeface(site.brand, "heading");
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
  return (
    <div className="flex-1" style={{ ...typeface(site.brand, "body"), background: color.neutral_surface, color: color.neutral_text }}>
      <header className="flex justify-center border-b px-4 py-4" style={{ borderColor: color.neutral_border }}>
        <a href="/" aria-label={`${site.name} home`} className="flex h-12 items-center rounded px-2" style={site.logoOnDark ? { background: color.brand_primary } : undefined}>
          <SiteLogo site={site} className="max-h-full w-auto object-contain py-1" />
        </a>
      </header>
      <main className="mx-auto max-w-xl px-4 py-14">
        <h1 className="text-4xl leading-tight" style={heading}>Share your photos</h1>
        <p className="mt-4 text-lg" style={{ color: color.neutral_text_muted }}>Got a good one from {site.name}? Send it to us. Nothing goes on the website until we have looked at it.</p>
        <div className="mt-10">
          {open && siteKey ? (
            <UploadForm business={site.name} source={sourceFrom(source)} siteKey={siteKey} color={color} />
          ) : (
            <p className="rounded-lg border p-4" style={{ borderColor: color.neutral_border }}>
              {open ? "Photo uploads aren't open yet. Please check back soon." : "Photo uploads are paused right now. Please try again later."}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
