import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

// Boat's brand fonts (bre/shared/design-journal/004): Outfit for headings, Inter for text.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] });

// Hidden from search engines until the go-live checklist says otherwise (the old site stays the
// public one). Page-level metadata in page.tsx repeats this via siteMetadata.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
