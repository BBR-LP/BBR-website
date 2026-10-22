"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

// A row of photos you swipe or step through with the two buttons. Plain scrolling underneath
// (scroll-snap), so touch, trackpad and arrow keys work without any script; the buttons are the
// extra for a mouse. With few enough photos to fit on screen the buttons are not shown.
export function Carousel({ label, children, buttonBg, buttonText }: { label: string; children: ReactNode; buttonBg: string; buttonText: string }) {
  const track = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: true });

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const step = (direction: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const slide = el.firstElementChild as HTMLElement | null;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * (slide ? slide.offsetWidth + 16 : el.clientWidth), behavior: reduce ? "auto" : "smooth" });
  };

  const button = "h-11 w-11 rounded-full text-xl leading-none transition-opacity disabled:opacity-30";
  return (
    <div role="region" aria-roledescription="carousel" aria-label={label}>
      <ul
        ref={track}
        tabIndex={0}
        aria-label={label}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </ul>
      {!(edge.start && edge.end) && (
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" aria-label="Previous photo" disabled={edge.start} onClick={() => step(-1)} className={button} style={{ background: buttonBg, color: buttonText }}>‹</button>
          <button type="button" aria-label="Next photo" disabled={edge.end} onClick={() => step(1)} className={button} style={{ background: buttonBg, color: buttonText }}>›</button>
        </div>
      )}
    </div>
  );
}
