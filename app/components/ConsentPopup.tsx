"use client";

import { useEffect, useRef, useState, type AnimationEvent } from "react";

// "here" = NO is in the pop-up; "stealing" = the goblin is running off with it; "gone" = it's gone
type NoButton = "here" | "stealing" | "gone";

/**
 * "Are you sure?" pop-up with Yes / No, over a darkened screen.
 * It's always in the page so it can animate in and out (see .consent-* in
 * globals.css); while closed it's invisible and can't be clicked or tabbed to.
 *
 * - YES calls onYes (the Timeline page opens the pay wall).
 * - NO: a goblin runs in, steals the NO button and runs off, then YES slides to the middle.
 * - Esc calls onClose.
 */
export default function ConsentPopup({
  isOpen,
  panelHidden = false,
  onYes,
  onClose,
}: {
  isOpen: boolean;
  /** Keep the dark background but hide the panel (while the pay wall is on top) */
  panelHidden?: boolean;
  onYes: () => void;
  onClose: () => void;
}) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [noButton, setNoButton] = useState<NoButton>("here");

  // Every time the pop-up opens, the NO button is back.
  // (React's way to reset state when a prop changes, without an effect.)
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) setNoButton("here");
  }

  useEffect(() => {
    if (!isOpen) return;
    // Move keyboard focus into the pop-up
    popupRef.current?.focus({ preventScroll: true });
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  function stealNo() {
    setNoButton("stealing");
    // NO can't keep focus once it's gone, so park it on the pop-up itself
    popupRef.current?.focus({ preventScroll: true });
  }

  function goblinDone(event: AnimationEvent<HTMLDivElement>) {
    // Only the goblin's own run (not the animations inside him)
    if (event.target === event.currentTarget) setNoButton("gone");
  }

  const stolen = noButton !== "here";

  return (
    <div
      className={`consent-layer${isOpen ? " is-open" : ""}${panelHidden ? " is-panel-hidden" : ""}`}
      inert={!isOpen || panelHidden}
    >
      <div
        ref={popupRef}
        className="consent-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
        aria-describedby="consent-text"
        tabIndex={-1}
      >
        <h2 id="consent-title" className="bs-text consent-title">
          Are you sure?
        </h2>
        <p id="consent-text" className="consent-fineprint">
          This message will be displayed once so we can exploit your consent.
        </p>

        <div className={`consent-buttons${stolen ? " is-no-stolen" : ""}`}>
          <button type="button" className="bs-text consent-btn consent-btn--yes" onClick={onYes}>
            Yes
          </button>

          <div className="consent-no-slot">
            <button
              type="button"
              className={`bs-text consent-btn consent-btn--no${stolen ? " is-stolen" : ""}${
                noButton === "gone" ? " is-gone" : ""
              }`}
              onClick={stealNo}
              disabled={stolen}
              aria-hidden={stolen}
            >
              No
            </button>

            {noButton === "stealing" && (
              <div className="consent-goblin" onAnimationEnd={goblinDone} aria-hidden="true">
                <img className="consent-goblin-img" src="/play/goblin.png" alt="" draggable={false} />
                <span className="bs-text consent-btn consent-btn--no consent-goblin-no">No</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
