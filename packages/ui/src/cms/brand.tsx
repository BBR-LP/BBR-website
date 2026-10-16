import { getSite } from "../template/registry";
import type { SiteSlug } from "../template/types";

// The site's name and small logo at the top of the editing screen's sidebar, in place of "Keystatic",
// so it is obvious which site is open. Both come from the site registry, so they can't drift. A site
// with no logo mark yet gets its first letter on a square in its brand color, not Keystatic's bolt.
export function keystaticBrand(slug: SiteSlug) {
  const site = getSite(slug);
  const mark = site.mark;
  const { color } = site.brand;
  const box = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    height: 24, borderRadius: 6, overflow: "hidden",
  } as const;
  return {
    name: site.name,
    mark: () =>
      mark ? (
        <span aria-hidden="true" style={{ ...box, width: mark.wide ? 44 : 24, padding: mark.wide ? "0 5px" : 0, background: mark.onBrand ? color.brand_primary : undefined }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mark.src} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </span>
      ) : (
        <span aria-hidden="true" style={{ ...box, width: 24, background: color.brand_primary, color: color.on_primary, fontSize: 14, fontWeight: 700 }}>
          {site.name.trim().charAt(0).toUpperCase()}
        </span>
      ),
  };
}
