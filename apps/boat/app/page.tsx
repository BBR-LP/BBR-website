import { SitePage, siteMetadata } from "@bbr/ui";
import { boat } from "../boat-content";

// indexable: false until go-live (the live mlboatrental.com is still the old Squarespace site).
export const generateMetadata = () => siteMetadata("boat", boat, { indexable: false });

export default function Home() {
  return <SitePage slug="boat" content={boat} />;
}
