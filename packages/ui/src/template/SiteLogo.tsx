import { typeface } from "./typeface";
import type { SiteInfo } from "./registry";

// The site's logo, or its name set in the brand's heading font when it has no logo yet.
export function SiteLogo({ site, className }: { site: SiteInfo; className?: string }) {
  if (!site.logo) {
    return (
      <span className="text-2xl uppercase text-center leading-tight"
        style={{ ...typeface(site.brand, "heading"), color: site.brand.color.brand_primary }}>
        {site.name}
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={site.logo} alt={`${site.name} logo`} className={className} />;
}
