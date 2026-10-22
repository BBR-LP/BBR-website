import type { Metadata } from "next";
import "./globals.css";

// Private. Never indexed, and the pages serve nothing until the data folder is configured.
export const metadata: Metadata = { title: "Photo review", robots: { index: false, follow: false } };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-stone-50 text-stone-900 antialiased">{children}</body>
    </html>
  );
}
