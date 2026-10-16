import { SitePage, siteMetadata } from "@bbr/ui";
import { getBoatContent } from "../boat-content";

// indexable: false until go-live (the live mlboatrental.com is still the old Squarespace site).
export async function generateMetadata() {
  return siteMetadata("boat", await getBoatContent(), { indexable: false });
}

export default async function Home() {
  return <SitePage slug="boat" content={await getBoatContent()} />;
}
