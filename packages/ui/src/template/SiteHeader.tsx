"use client";

import { useEffect, useRef, useState } from "react";
import { SiteLogo } from "./SiteLogo";
import { typeface } from "./typeface";
import type { SiteInfo } from "./registry";
import type { NavItem } from "./types";

// Aman-style header: Menu on the left, logo in the center, the one main button on the right.
// Solid, never see-through; the logo shrinks once the visitor scrolls. Menu opens a panel from
// the left with the page's sections and the sister sites.
export function SiteHeader({ site, nav, cta, ctaHref, others }: { site: SiteInfo; nav: NavItem[]; cta: string; ctaHref: string; others: SiteInfo[] }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // While the panel is open: Escape closes it, the page behind stops scrolling, focus moves in
  // and returns to the Menu button on close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const trigger = menuButton.current;
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      trigger?.focus();
    };
  }, [open]);

  const { color } = site.brand;
  const heading = typeface(site.brand, "heading");
  const ctaButton = (
    <a href={ctaHref} target="_blank" rel="noopener" className="inline-block shrink-0 rounded-full px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity" style={{ background: color.primary_action, color: color.on_primary }}>
      {cta}
    </a>
  );

  return (
    <>
      <header className="sticky top-0 z-10 border-b" style={{ background: color.neutral_surface, borderColor: color.neutral_border }}>
        <div className={`mx-auto max-w-6xl px-4 grid grid-cols-[1fr_auto_1fr] items-center gap-4 transition-[padding] duration-300 ${scrolled ? "py-2" : "py-3"}`}>
          <button ref={menuButton} type="button" onClick={() => setOpen(true)} aria-label="Menu" aria-expanded={open} aria-controls="site-menu"
            className="justify-self-start flex items-center gap-3 py-2 text-sm" style={{ color: color.neutral_text }}>
            <MenuIcon />
            <span className="hidden sm:inline">Menu</span>
          </button>
          <a href="#top" className={`flex items-center rounded px-2 transition-[height] duration-300 ${scrolled ? "h-9" : "h-12"}`}
            style={site.logoOnDark ? { background: color.brand_primary } : undefined}>
            <SiteLogo site={site} className="max-h-full w-auto object-contain py-1" />
          </a>
          {/* On phones the main button moves into the menu, so the logo keeps the center. */}
          <div className="justify-self-end hidden sm:block">{ctaButton}</div>
        </div>
      </header>

      <div className={`fixed inset-0 z-20 transition-opacity duration-300 motion-reduce:transition-none ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        style={{ background: "rgb(0 0 0 / 0.35)" }} onClick={() => setOpen(false)} aria-hidden="true" />

      <div id="site-menu" role="dialog" aria-modal="true" aria-label="Menu" inert={!open}
        className={`fixed inset-y-0 left-0 z-30 w-full max-w-sm flex flex-col overflow-y-auto transition-transform duration-300 motion-reduce:transition-none ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: color.neutral_surface, color: color.neutral_text }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: color.neutral_border }}>
          <button ref={closeButton} type="button" onClick={() => setOpen(false)} className="flex items-center gap-3 py-2 text-sm">
            <CloseIcon />
            Close
          </button>
        </div>

        <nav className="px-6 py-8">
          <ul className="grid gap-5">
            {nav.map((item) => (
              <li key={item.href}>
                <a href={item.href} onClick={() => setOpen(false)} className="text-3xl leading-tight hover:opacity-70 transition-opacity" style={heading}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-8">{ctaButton}</div>
        </nav>

        <div className="mt-auto px-6 py-8 border-t" style={{ borderColor: color.neutral_border }}>
          <div className="text-xs uppercase tracking-widest" style={{ color: color.neutral_text_muted }}>Also in Lake Placid</div>
          <ul className="mt-4 grid gap-3">
            {others.map((o) => (
              <li key={o.slug}>
                <a href={o.url} className="hover:opacity-70 transition-opacity">{o.name}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden="true">
      <path d="M0 1h22M0 7h22M0 13h22" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M1 1l14 14M15 1L1 15" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
