import type { Metadata } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import "./globals.css";

// Bike's brand fonts (bre/shared/design-journal/004): Barlow Condensed for headings, Inter for text.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const barlowCondensed = Barlow_Condensed({ variable: "--font-barlow-condensed", subsets: ["latin"], weight: "700" });

// Hidden from search engines until the go-live checklist says otherwise (the old site stays the
// public one). Page-level metadata in page.tsx repeats this via siteMetadata.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${barlowCondensed.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
