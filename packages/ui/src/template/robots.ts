import type { MetadataRoute } from "next";

// robots.txt for every site: crawlers skip the editing screen and its API. (Until go-live each site
// is also marked noindex as a whole, in its layout.)
export default function editorRobots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: ["/keystatic", "/api/keystatic"] } };
}
