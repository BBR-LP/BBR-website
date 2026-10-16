"use client";

// Read in the visitor's browser, so the footer never shows last year's date.
export function CurrentYear() {
  return <span suppressHydrationWarning>{new Date().getFullYear()}</span>;
}
