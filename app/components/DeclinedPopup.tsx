"use client";

import { useEffect, useRef } from "react";

// A bank card with a red cross badge
function DeclinedCardIcon() {
  return (
    <svg className="declined-icon" viewBox="0 0 120 90" aria-hidden="true">
      <rect x="6" y="14" width="92" height="62" rx="9" fill="#cbd5e1" stroke="#000" strokeWidth="4" />
      <rect x="6" y="28" width="92" height="12" fill="#334155" />
      <rect x="18" y="50" width="22" height="14" rx="3" fill="#facc15" stroke="#000" strokeWidth="2.5" />
      <rect x="48" y="55" width="36" height="5" rx="2.5" fill="#64748b" />
      <circle cx="96" cy="66" r="20" fill="#e01a36" stroke="#000" strokeWidth="4" />
      <path d="M88 58 L104 74 M104 58 L88 74" stroke="#fff" strokeWidth="5.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Shown on the Gems pages when PAY is clicked: the card gets "declined".
 * Same look as the "Are you sure?" pop-up (it reuses its .consent-* styles),
 * on top of the pay wall. OK or Esc closes it.
 */
export default function DeclinedPopup({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const okRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    okRef.current?.focus({ preventScroll: true });
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  return (
    <div className={`consent-layer declined-layer${isOpen ? " is-open" : ""}`} inert={!isOpen}>
      <div
        className="consent-popup declined-popup"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="declined-title"
        aria-describedby="declined-text"
      >
        <DeclinedCardIcon />
        <h2 id="declined-title" className="bs-text consent-title declined-title">
          Card declined
        </h2>
        <p id="declined-text" className="declined-message">
          You spent too much money on your groceries at woolies and cannot afford any gems or coin packs.
        </p>
        <button ref={okRef} type="button" className="bs-text consent-btn declined-ok" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
}
