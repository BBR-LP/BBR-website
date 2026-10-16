import type { Brand } from "./types";

// Maps a brand's font names to the CSS variables each app's layout defines for the fonts it loads.
// The fallback inside var() keeps a font the app didn't load (a sister card's name) from breaking.
const fontVars: Record<string, string> = {
  "Barlow Condensed": "--font-barlow-condensed",
  "Bebas Neue": "--font-bebas-neue",
  Outfit: "--font-outfit",
  Inter: "--font-inter",
};

export function fontStack(value: string | null) {
  if (!value) return undefined;
  const first = value.split(",")[0].replace(/"/g, "").trim();
  const v = fontVars[first];
  return v ? `var(${v}, "${first}"), ${value}` : value;
}

// Font family plus the brand's chosen weight, for a heading or body text.
export function typeface(brand: Brand, role: "heading" | "body") {
  return { fontFamily: fontStack(brand.font[role]), fontWeight: brand.font_weight[role] };
}
