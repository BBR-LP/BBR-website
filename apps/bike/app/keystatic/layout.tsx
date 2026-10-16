import type { Metadata } from "next";
import KeystaticApp from "./keystatic";

// The editing screen is for the owners only: keep it out of search results.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Layout() {
  return <KeystaticApp />;
}
