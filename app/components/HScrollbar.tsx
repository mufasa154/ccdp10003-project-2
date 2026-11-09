"use client";

import { useEffect, useRef, useState, type PointerEvent, type RefObject } from "react";

/**
 * A simple horizontal scrollbar drawn under a row that scrolls sideways
 * (the row's own scrollbar is hidden in globals.css). It follows the row as it
 * scrolls; drag the thumb, or click the bar to jump there. Scrolling up/down
 * with a mouse wheel anywhere on the page also slides the row sideways.
 */
export default function HScrollbar({ target }: { target: RefObject<HTMLElement | null> }) {
  const barRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; scrollLeft: number } | null>(null);
  // Thumb size and position, as fractions of the bar's width
  const [thumb, setThumb] = useState({ size: 1, start: 0 });

  useEffect(() => {
    const row = target.current;
    if (!row) return;
    const update = () => {
      const max = row.scrollWidth - row.clientWidth;
      const size = row.scrollWidth > 0 ? Math.min(1, row.clientWidth / row.scrollWidth) : 1;
      setThumb({ size, start: max > 0 ? (row.scrollLeft / max) * (1 - size) : 0 });
    };
    row.addEventListener("scroll", update, { passive: true });
    // Also runs once straight away, and again when the window or the cards change size
    const resize = new ResizeObserver(update);
    resize.observe(row);
    for (const child of row.children) resize.observe(child);

    // Nothing on these pages scrolls up/down, so turn up/down wheel scrolling
    // anywhere in the window (black bars included) into sideways scrolling of the row.
    // Pages you've left are hidden by Next.js, which also removes this listener.
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // sideways swipes already scroll the row
      if (row.closest("[inert]")) return; // the pay wall is open
      e.preventDefault();
      // Some browsers report the wheel in lines or pages instead of pixels
      const pixels = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaMode === 2 ? e.deltaY * row.clientWidth : e.deltaY;
      row.scrollBy({ left: pixels });
    };
    window.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      row.removeEventListener("scroll", update);
      resize.disconnect();
      window.removeEventListener("wheel", onWheel);
    };
  }, [target]);

  function scrollToThumbStart(start: number, smooth: boolean) {
    const row = target.current;
    if (!row || thumb.size >= 1) return;
    const max = row.scrollWidth - row.clientWidth;
    const clamped = Math.min(Math.max(start, 0), 1 - thumb.size);
    row.scrollTo({ left: (clamped / (1 - thumb.size)) * max, behavior: smooth ? "smooth" : "auto" });
  }

  // Click on the bar: centre the thumb where you clicked
  function onBarDown(e: PointerEvent<HTMLDivElement>) {
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    scrollToThumbStart((e.clientX - rect.left) / rect.width - thumb.size / 2, true);
  }

  function onThumbDown(e: PointerEvent<HTMLDivElement>) {
    const row = target.current;
    if (!row) return;
    e.stopPropagation(); // don't also count as a click on the bar
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, scrollLeft: row.scrollLeft };
  }

  function onThumbMove(e: PointerEvent<HTMLDivElement>) {
    const row = target.current;
    const bar = barRef.current;
    const drag = dragRef.current;
    if (!row || !bar || !drag) return;
    const travel = bar.clientWidth * (1 - thumb.size); // how far the thumb can move, in pixels
    if (travel <= 0) return;
    const max = row.scrollWidth - row.clientWidth;
    row.scrollTo({ left: drag.scrollLeft + ((e.clientX - drag.x) / travel) * max });
  }

  function onThumbUp() {
    dragRef.current = null;
  }

  return (
    <div
      className="hscrollbar"
      ref={barRef}
      onPointerDown={onBarDown}
      hidden={thumb.size >= 1} // nothing to scroll
      aria-hidden="true"
    >
      <div
        className="hscrollbar-thumb"
        style={{ left: `${thumb.start * 100}%`, width: `${thumb.size * 100}%` }}
        onPointerDown={onThumbDown}
        onPointerMove={onThumbMove}
        onPointerUp={onThumbUp}
        onPointerCancel={onThumbUp}
      />
    </div>
  );
}
