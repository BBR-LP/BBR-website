import { SitePage, siteMetadata } from "@bbr/ui";
import { getBikeContent } from "../bike-content";

// indexable: false until go-live (the live bikelakeplacid.us is still the old Squarespace site).
export async function generateMetadata() {
  return siteMetadata("bike", await getBikeContent(), { indexable: false });
}

export default async function Home() {
  return <SitePage slug="bike" content={await getBikeContent()} />;
}
