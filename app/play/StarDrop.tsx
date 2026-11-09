"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

// Rarity ladder: every tap has a chance to bump it up a level
const RARITIES = [
  { name: "RARE", bg: "#35b82b", glow: "#c8ff7a", coins: 50, gems: 5 },
  { name: "SUPER RARE", bg: "#1c74f0", glow: "#9fe1ff", coins: 100, gems: 12 },
  { name: "EPIC", bg: "#b02cf0", glow: "#ffb8ff", coins: 250, gems: 30 },
  { name: "MYTHIC", bg: "#ec2f4b", glow: "#ffc2c2", coins: 500, gems: 80 },
  { name: "LEGENDARY", bg: "#f2b400", glow: "#fff4b0", coins: 1000, gems: 200 },
];

type Phase = "closed" | "burst" | "reward" | "goblin" | "stolen";
type PopupStep = 0 | 1 | 2 | 3;

// Rounded 7-point star, centred on (60, 60)
const STAR_PATH = (() => {
  const pts: string[] = [];
  for (let i = 0; i < 14; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 7;
    const r = i % 2 === 0 ? 54 : 36;
    pts.push(`${(60 + Math.cos(a) * r).toFixed(1)},${(60 + Math.sin(a) * r).toFixed(1)}`);
  }
  return `M${pts.join("L")}Z`;
})();

function StarDropArt() {
  return (
    <svg className="sd-star-svg" viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <linearGradient id="sd-star-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe45c" />
          <stop offset="1" stopColor="#ff9d00" />
        </linearGradient>
      </defs>
      <path d={STAR_PATH} fill="url(#sd-star-fill)" stroke="#000" strokeWidth="6" strokeLinejoin="round" />
      <path d={STAR_PATH} fill="none" stroke="#fff6b8" strokeWidth="3" strokeLinejoin="round" transform="translate(60 60) scale(0.78) translate(-60 -60)" opacity="0.7" />
      {/* Face */}
      <circle cx="60" cy="62" r="25" fill="#ffc21a" stroke="#000" strokeWidth="4" />
      <ellipse cx="51" cy="57" rx="4.5" ry="6.5" fill="#000" />
      <ellipse cx="69" cy="57" rx="4.5" ry="6.5" fill="#000" />
      <path d="M49 68q11 11 22 0" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function GemPile() {
  const gems = [
    [34, 88, -12], [62, 92, 6], [90, 86, 14], [48, 66, -4], [78, 64, 10], [63, 44, 0],
  ];
  return (
    <svg className="sd-loot-svg" viewBox="0 0 130 120" aria-hidden="true">
      {gems.map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
          <image href="/gem.png" x="-18" y="-18" width="36" height="36" />
        </g>
      ))}
    </svg>
  );
}

function rand(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** A single star drop. Whatever it gives you, a goblin takes it. */
export default function StarDrop({ onOpenPaywall }: { onOpenPaywall: () => void }) {
  const tapsNeeded = useMemo(() => rand(3, 4), []);
  const lootKind = "GEMS" as const;
  const [taps, setTaps] = useState(0);
  const [rarity, setRarity] = useState(0);
  const [hit, setHit] = useState(0); // bumps to restart the tap animation
  const [upgraded, setUpgraded] = useState(false);
  const [phase, setPhase] = useState<Phase>("closed");
  const [popupStep, setPopupStep] = useState<PopupStep>(0);

  const r = RARITIES[rarity];
  const amount = r.gems;

  // Sound effect when the Star Drop first appears
  useEffect(() => {
    const audio = new Audio("/rare-brawl-stars-star-drop.mp3");
    audio.volume = 0.7;
    void audio.play().catch(() => {});
    return () => {
      audio.pause();
    };
  }, []);

  // Timed phases after the drop opens
  useEffect(() => {
    const next: Partial<Record<Phase, [Phase, number]>> = {
      burst: ["reward", 650],
      reward: ["goblin", 1400],
      goblin: ["stolen", 2700],
    };
    const step = next[phase];
    if (!step) return;
    const id = setTimeout(() => setPhase(step[0]), step[1]);
    return () => clearTimeout(id);
  }, [phase]);

  // Automatically pop up the "Claim your gems back?" dialog shortly after the goblin steals them
  useEffect(() => {
    if (phase !== "stolen" || popupStep !== 0) return;
    const id = setTimeout(() => setPopupStep(1), 1100);
    return () => clearTimeout(id);
  }, [phase, popupStep]);

  function tap() {
    if (phase === "closed") {
      if (taps >= tapsNeeded) return; // already opening
      const t = taps + 1;
      setTaps(t);
      setHit((h) => h + 1);
      // Each tap has a chance to upgrade (it never goes past legendary)
      const up = rarity < RARITIES.length - 1 && Math.random() < 0.4;
      setUpgraded(up);
      if (up) setRarity((v) => v + 1);
      if (t >= tapsNeeded) setTimeout(() => setPhase("burst"), 450);
    } else if (phase === "stolen" && popupStep === 0) {
      setPopupStep(1);
    }
  }

  const showReward = phase === "reward" || phase === "goblin" || phase === "stolen";
  const style = { "--sd-bg": r.bg, "--sd-glow": r.glow } as CSSProperties;

  return (
    <div
      className={`sd ${showReward ? "sd--reward" : ""}`}
      style={style}
      onClick={tap}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && tap()}
    >
      <div className="sd-pattern" />
      <div className="bs-text sd-banner">DAILY WINS</div>

      {!showReward && (
        <>
          <div key={`r${rarity}`} className={`bs-text sd-rarity ${upgraded ? "sd-rarity--up" : ""}`}>
            {r.name}
          </div>
          <div className="sd-glow" />
          <div key={`s${hit}`} className={`sd-star ${hit > 0 ? "sd-star--hit" : ""} ${phase === "burst" ? "sd-star--burst" : ""}`}>
            <StarDropArt />
          </div>
          <div className="sd-chances">
            <div className="bs-text">UPGRADE CHANCES</div>
            <div className="sd-dots">
              {Array.from({ length: tapsNeeded }, (_, i) => (
                <span key={i} className={i < taps ? "sd-dot sd-dot--used" : "sd-dot"} />
              ))}
            </div>
          </div>
          {phase === "closed" && <div className="bs-text sd-hint">TAP TO OPEN!</div>}
          {phase === "burst" && <div className="sd-flash" />}
        </>
      )}

      {showReward && (
        <div className="sd-reward">
          <div className="bs-text sd-loot-title">{lootKind}</div>
          <div className={`sd-loot ${phase !== "reward" ? "sd-loot--stolen" : ""}`}>
            <GemPile />
          </div>
          <div className="bs-text sd-amount">x {phase === "stolen" ? 0 : amount}</div>

          {phase !== "reward" && (
            <div className="sd-goblin">
              <img src="/play/goblin.png" alt="Goblin" draggable={false} />
              <div className="sd-goblin-loot"><GemPile /></div>
            </div>
          )}

          {phase === "stolen" && (
            <>
              <div className="bs-text sd-stolen">A GOBLIN STOLE YOUR {lootKind}!</div>
              {popupStep === 0 && <div className="bs-text sd-hint">TAP TO CONTINUE</div>}
            </>
          )}
        </div>
      )}

      {popupStep > 0 && (
        <div
          className="play-overlay sd-popup-overlay"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {popupStep === 1 && (
            <div className="play-panel sd-popup-panel" key="popup-1">
              <div className="bs-text sd-popup-badge">GOBLIN THEFT ALERT</div>
              <div className="bs-text play-title sd-popup-title">CLAIM GEMS BACK?</div>
              <div className="bs-text play-sub sd-popup-sub">
                THE GOBLIN JUST RAN OFF WITH YOUR <span className="sd-popup-highlight">{amount} GEMS</span>! DO YOU WANT TO CLAIM YOUR GEMS BACK?
              </div>
              <div className="play-buttons">
                <button
                  type="button"
                  className="bs-text play-btn play-btn--green"
                  onClick={onOpenPaywall}
                >
                  YES
                </button>
                <button
                  type="button"
                  className="bs-text play-btn sd-btn--red"
                  onClick={() => setPopupStep(2)}
                >
                  NO
                </button>
              </div>
            </div>
          )}

          {popupStep === 2 && (
            <div className="play-panel sd-popup-panel sd-popup-panel--warn" key="popup-2">
              <div className="bs-text sd-popup-badge sd-popup-badge--warn">WAIT A SECOND!</div>
              <div className="bs-text play-title sd-popup-title">ARE YOU SURE?!</div>
              <div className="bs-text play-sub sd-popup-sub">
                YOU&apos;RE REALLY GOING TO LET A SNEAKY GOBLIN KEEP YOUR <span className="sd-popup-highlight">{amount} GEMS</span> FOR FREE?! RE-AFFIRM YOUR CHOICE!
              </div>
              <div className="play-buttons">
                <button
                  type="button"
                  className="bs-text play-btn play-btn--yellow"
                  onClick={onOpenPaywall}
                >
                  YES, CLAIM THEM!
                </button>
                <button
                  type="button"
                  className="bs-text play-btn sd-btn--red"
                  onClick={() => setPopupStep(3)}
                >
                  NO, I&apos;M SURE
                </button>
              </div>
            </div>
          )}

          {popupStep === 3 && (
            <div className="play-panel sd-popup-panel sd-popup-panel--danger" key="popup-3">
              <div className="bs-text sd-popup-badge sd-popup-badge--danger">FINAL WARNING!</div>
              <div className="bs-text play-title play-title--red sd-popup-title">100% POSITIVE?!</div>
              <div className="bs-text play-sub sd-popup-sub">
                LAST CHANCE! IF YOU GIVE UP YOUR <span className="sd-popup-highlight">{amount} GEMS</span>, THE GOBLIN KEEPS THEM FOREVER. DO YOU STILL STAND BY YOUR DECISION?!
              </div>
              <div className="bs-text play-fineprint">
                *DECLINING GEM RECOVERY INCURS A MANDATORY GOBLIN CANCELLATION FEE
              </div>
              <div className="play-buttons">
                <button
                  type="button"
                  className="bs-text play-btn play-btn--green"
                  onClick={onOpenPaywall}
                >
                  CLAIM MY GEMS!
                </button>
                <button
                  type="button"
                  className="bs-text play-btn sd-btn--red"
                  onClick={onOpenPaywall}
                >
                  STILL NO!
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
