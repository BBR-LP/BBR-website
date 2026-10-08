import type { Metadata } from "next";

export const metadata: Metadata = { title: "Bike Lake Placid" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
