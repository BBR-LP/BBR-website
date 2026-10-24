import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";

// The 10K's brand fonts (bre/shared/design-journal/004): Bebas Neue for headings, Inter for text.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const bebasNeue = Bebas_Neue({ variable: "--font-bebas-neue", subsets: ["latin"], weight: "400" });

// Hidden from search engines until the go-live checklist says otherwise. Page-level metadata in
// page.tsx repeats this via siteMetadata.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${bebasNeue.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
