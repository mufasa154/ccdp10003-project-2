"use client";

import { useRouter } from "next/navigation";
import { useState, type CSSProperties } from "react";
import { useGems } from "./gems";

type HotspotStyle = CSSProperties & {
  "--x": number;
  "--y": number;
  "--w": number;
  "--h": number;
};

export type ShopTab = "timeline" | "assignments" | "offers";

// Bottom tabs on project2-a/b/c.png, in design pixels (1920 x 1080).
// The ASSIGNMENTS spot stops before the +99 banner.
const TABS: { tab: ShopTab; label: string; href: string; spot: HotspotStyle }[] = [
  {
    tab: "timeline",
    label: "Timeline",
    href: "/timeline",
    spot: { "--x": 200, "--y": 1000, "--w": 263, "--h": 70 },
  },
  {
    tab: "assignments",
    label: "Assignments",
    href: "/assignments",
    spot: { "--x": 734, "--y": 1000, "--w": 378, "--h": 70 },
  },
  {
    tab: "offers",
    label: "Offers",
    href: "/offers",
    spot: { "--x": 1461, "--y": 1000, "--w": 203, "--h": 70 },
  },
];

// Locked until all three Timeline games are bought (the gem balance hits 0)
const LOCKABLE: ShopTab[] = ["assignments", "offers"];

function LockIcon() {
  return (
    <svg className="tab-lock-icon" viewBox="0 0 40 48" aria-hidden="true">
      {/* Shackle: black outline under a silver bar */}
      <g className="tab-lock-shackle">
        <path d="M11 22 V15 a9 9 0 0 1 18 0 V22" fill="none" stroke="#000" strokeWidth="8" />
        <path d="M11 22 V15 a9 9 0 0 1 18 0 V22" fill="none" stroke="#cbd5e1" strokeWidth="4" />
      </g>
      {/* Gold body */}
      <rect x="4" y="20" width="32" height="25" rx="5" fill="#ffc400" stroke="#000" strokeWidth="3" />
      <rect x="8" y="23" width="24" height="3.5" rx="1.75" fill="#fff6b0" opacity="0.8" />
      {/* Keyhole */}
      <circle cx="20" cy="31" r="3.6" fill="#5b3a00" />
      <rect x="18.4" y="32" width="3.2" height="7.5" rx="1.6" fill="#5b3a00" />
    </svg>
  );
}

/**
 * Gem count, back/home buttons and the TIMELINE / ASSIGNMENTS / OFFERS tabs
 * shared by the pages that use project2-a/b/c.png.
 */
export default function ShopNav({
  current,
  backTo = "/timeline",
  inert = false,
  hidden = false,
}: {
  /** The tab whose page you're on: clicking it does nothing */
  current?: ShopTab;
  /** Where the back arrow goes; null = it does nothing (on the Timeline page itself) */
  backTo?: string | null;
  inert?: boolean;
  /**
   * Takes the gem count and buttons off the screen (while Timeline shows a game
   * you've bought). Their animations wait until they're back: the gem count
   * pops and the locks open when you return.
   */
  hidden?: boolean;
}) {
  const router = useRouter();
  const gems = useGems();
  const locked = gems > 0;

  // The number pops when it changes (until the pop has played once)
  const [shownGems, setShownGems] = useState(gems);
  // Locks that were on screen when this page appeared play an unlock animation, then go
  const [lockedAtStart] = useState(locked);
  const [unlockPlayed, setUnlockPlayed] = useState(false);
  // Bumped on every click on a locked tab: restarts the message and the lock's wiggle
  const [lockedClicks, setLockedClicks] = useState(0);

  function showLocked() {
    setLockedClicks((n) => n + 1);
  }

  return (
    <>
      <div
        key={gems}
        className={`gem-count${gems !== shownGems ? " is-changed" : ""}`}
        hidden={hidden}
        onAnimationEnd={() => setShownGems(gems)}
      >
        {gems}
      </div>

      <div className="shop-buttons" id="shop-buttons" inert={inert} hidden={hidden}>
        <button
          className="hotspot"
          id="btn-back"
          aria-label="Back"
          style={{ "--x": 0, "--y": 0, "--w": 188, "--h": 133 } as HotspotStyle}
          onClick={backTo === null ? undefined : () => router.push(backTo)}
        />
        <button
          className="hotspot"
          id="btn-home"
          aria-label="Home"
          style={{ "--x": 1732, "--y": 0, "--w": 188, "--h": 124 } as HotspotStyle}
          // Home = Deadline Dash, the first page of the site
          onClick={() => router.push("/")}
        />
        {TABS.map(({ tab, label, href, spot }) => {
          const lockable = LOCKABLE.includes(tab);
          const isLocked = lockable && locked;
          const showUnlocking = lockable && !locked && lockedAtStart && !unlockPlayed;

          let onClick: (() => void) | undefined;
          if (isLocked) onClick = showLocked;
          else if (tab !== current) onClick = () => router.push(href);
          // (the tab you're already on stays clickable but does nothing)

          return (
            <button
              key={tab}
              className={`hotspot${isLocked ? " is-locked" : ""}`}
              id={`btn-${tab}`}
              aria-label={isLocked ? `${label} (locked)` : label}
              aria-disabled={isLocked || undefined}
              aria-current={tab === current ? "page" : undefined}
              style={spot}
              onClick={onClick}
            >
              {(isLocked || showUnlocking) && (
                <span
                  key={isLocked ? `locked-${lockedClicks}` : "unlocking"}
                  className={`tab-lock${isLocked && lockedClicks > 0 ? " is-wiggling" : ""}${
                    showUnlocking ? " is-unlocking" : ""
                  }`}
                  onAnimationEnd={(e) => {
                    if (showUnlocking && e.target === e.currentTarget) setUnlockPlayed(true);
                  }}
                >
                  <LockIcon />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {lockedClicks > 0 && !hidden && (
        <div
          key={lockedClicks}
          className="bs-text lock-toast"
          role="status"
          // Gone once it has faded out, so it doesn't replay when you come back to this page
          onAnimationEnd={() => setLockedClicks(0)}
        >
          You must purchase all three items in Timeline.
        </div>
      )}
    </>
  );
}
