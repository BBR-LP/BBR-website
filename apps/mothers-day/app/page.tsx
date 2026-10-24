import { SitePage, siteMetadata } from "@bbr/ui";
import { getMothersDayContent } from "../mothers-day-content";

// indexable: false until go-live.
export async function generateMetadata() {
  return siteMetadata("mothers-day", await getMothersDayContent(), { indexable: false });
}

export default async function Home() {
  return <SitePage slug="mothers-day" content={await getMothersDayContent()} />;
}
