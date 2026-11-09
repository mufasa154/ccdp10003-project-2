"use client";

import { useCallback, useRef, useState, type MouseEvent } from "react";
import DeclinedPopup from "../components/DeclinedPopup";
import Paywall from "../components/Paywall";
import ShopNav from "../components/ShopNav";

interface GemPack {
  amount: number;
  price: string;
  ribbon?: string;
  banner?: string;
  tier: 1 | 2 | 3 | 4 | 5 | 6;
}

interface CoinPack {
  amount: number;
  gemCost: number;
  banner?: string;
  tier: 1 | 2 | 3 | 4;
}

const GEM_PACKS: GemPack[] = [
  { amount: 30, price: "$70.00", tier: 1 },
  { amount: 80, price: "$170.00", tier: 2 },
  { amount: 170, price: "$330.00", ribbon: "+5%", banner: "POPULAR", tier: 3 },
  { amount: 360, price: "$670.00", ribbon: "+15%", tier: 4 },
  { amount: 950, price: "$1,690.00", ribbon: "+20%", tier: 5 },
  { amount: 2000, price: "$3,290.00", ribbon: "+25%", banner: "BEST VALUE", tier: 6 },
];

const COIN_PACKS: CoinPack[] = [
  { amount: 300, gemCost: 30, tier: 1 },
  { amount: 880, gemCost: 80, banner: "10% EXTRA", tier: 2 },
  { amount: 2040, gemCost: 170, banner: "20% EXTRA", tier: 3 },
  { amount: 4680, gemCost: 360, banner: "30% EXTRA", tier: 4 },
];

// SK Chan's gem art (public/gem.png)
function GemToken({ x, y, r = 16 }: { x: number; y: number; r?: number }) {
  return (
    <image
      href="/gem.png"
      x={x - r}
      y={y - r}
      width={r * 2}
      height={r * 2}
      preserveAspectRatio="xMidYMid meet"
    />
  );
}

function GemPackArt({ tier }: { tier: GemPack["tier"] }) {
  if (tier === 6) {
    return (
      <svg viewBox="0 0 160 115" aria-hidden="true">
        {/* Back chest lid */}
        <path
          d="M36 46 C36 16, 124 16, 124 46 Z"
          fill="#6366f1"
          stroke="#000"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          d="M46 44 C46 24, 114 24, 114 44 Z"
          fill="#312e81"
          stroke="#000"
          strokeWidth="3"
        />
        {/* Overflowing gems inside chest */}
        <GemToken x={56} y={48} r={14} />
        <GemToken x={80} y={42} r={15} />
        <GemToken x={104} y={48} r={14} />
        <GemToken x={68} y={56} r={15} />
        <GemToken x={92} y={56} r={15} />
        {/* Purple chest lower box */}
        <polygon
          points="34,56 126,56 120,96 40,96"
          fill="#9333ea"
          stroke="#000"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <rect x="72" y="56" width="16" height="16" rx="3" fill="#38bdf8" stroke="#000" strokeWidth="3" />
        {/* Foreground spilled gems */}
        <GemToken x={30} y={88} r={14} />
        <GemToken x={52} y={96} r={14} />
        <GemToken x={108} y={94} r={15} />
        <GemToken x={130} y={86} r={13} />
      </svg>
    );
  }

  const positionsByTier: Record<1 | 2 | 3 | 4 | 5, Array<[number, number, number]>> = {
    1: [
      [62, 68, 17],
      [98, 70, 17],
      [80, 52, 18],
      [54, 82, 17],
      [84, 82, 18],
    ],
    2: [
      [58, 48, 16],
      [58, 62, 16],
      [58, 76, 16],
      [96, 66, 16],
      [96, 80, 16],
      [76, 86, 17],
    ],
    3: [
      [52, 46, 15],
      [52, 60, 15],
      [52, 74, 15],
      [80, 42, 15],
      [80, 56, 15],
      [80, 70, 15],
      [108, 62, 15],
      [108, 76, 15],
      [74, 86, 16],
    ],
    4: [
      [46, 52, 14],
      [46, 66, 14],
      [46, 80, 14],
      [74, 38, 15],
      [74, 52, 15],
      [74, 66, 15],
      [74, 80, 15],
      [104, 48, 15],
      [104, 62, 15],
      [104, 76, 15],
      [92, 88, 15],
    ],
    5: [
      [38, 50, 13],
      [38, 64, 13],
      [38, 78, 13],
      [62, 36, 14],
      [62, 50, 14],
      [62, 64, 14],
      [62, 78, 14],
      [88, 34, 14],
      [88, 48, 14],
      [88, 62, 14],
      [88, 76, 14],
      [114, 48, 14],
      [114, 62, 14],
      [114, 76, 14],
      [76, 90, 15],
      [102, 88, 15],
    ],
  };

  return (
    <svg viewBox="0 0 160 115" aria-hidden="true">
      {positionsByTier[tier].map(([x, y, r], idx) => (
        <GemToken key={idx} x={x} y={y} r={r} />
      ))}
    </svg>
  );
}

function CoinToken({ x, y, r = 15 }: { x: number; y: number; r?: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <ellipse cx="0" cy="4" rx={r} ry={r * 0.68} fill="#d97706" stroke="#000" strokeWidth="2.6" />
      <ellipse cx="0" cy="0" rx={r} ry={r * 0.68} fill="#facc15" stroke="#000" strokeWidth="2.6" />
      <ellipse cx="0" cy="0" rx={r * 0.66} ry={r * 0.44} fill="#eab308" stroke="#92400e" strokeWidth="1.5" />
      <circle cx={-r * 0.2} cy={-r * 0.05} r={r * 0.1} fill="#78350f" />
      <circle cx={r * 0.2} cy={-r * 0.05} r={r * 0.1} fill="#78350f" />
    </g>
  );
}

function CoinPackArt({ tier }: { tier: CoinPack["tier"] }) {
  if (tier === 3 || tier === 4) {
    return (
      <svg viewBox="0 0 170 115" aria-hidden="true">
        {/* Back chest lid */}
        <path
          d="M40 46 C40 16, 130 16, 130 46 Z"
          fill="#6366f1"
          stroke="#000"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          d="M50 44 C50 24, 120 24, 120 44 Z"
          fill="#312e81"
          stroke="#000"
          strokeWidth="3"
        />
        {/* Coins inside chest */}
        <CoinToken x={60} y={46} r={14} />
        <CoinToken x={85} y={40} r={15} />
        <CoinToken x={110} y={46} r={14} />
        <CoinToken x={72} y={54} r={15} />
        <CoinToken x={98} y={54} r={15} />
        {/* Purple chest lower box */}
        <polygon
          points="38,56 132,56 126,96 44,96"
          fill="#9333ea"
          stroke="#000"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <rect x="77" y="56" width="16" height="16" rx="3" fill="#38bdf8" stroke="#000" strokeWidth="3" />
        {/* Side coin stacks */}
        <CoinToken x={30} y={76} r={14} />
        <CoinToken x={30} y={88} r={14} />
        <CoinToken x={140} y={76} r={14} />
        <CoinToken x={140} y={88} r={14} />
        {tier === 4 && (
          <>
            <CoinToken x={54} y={94} r={14} />
            <CoinToken x={116} y={94} r={14} />
          </>
        )}
      </svg>
    );
  }

  const coins =
    tier === 1
      ? [
          [56, 46, 15],
          [56, 58, 15],
          [56, 70, 15],
          [86, 54, 15],
          [86, 66, 15],
          [86, 78, 15],
          [114, 68, 15],
          [114, 80, 15],
          [72, 86, 16],
        ]
      : [
          [42, 52, 14],
          [42, 64, 14],
          [42, 76, 14],
          [68, 38, 14],
          [68, 50, 14],
          [68, 62, 14],
          [68, 74, 14],
          [96, 44, 14],
          [96, 56, 14],
          [96, 68, 14],
          [96, 80, 14],
          [124, 58, 14],
          [124, 70, 14],
          [124, 82, 14],
          [76, 88, 15],
        ];

  return (
    <svg viewBox="0 0 170 115" aria-hidden="true">
      {coins.map(([x, y, r], idx) => (
        <CoinToken key={idx} x={x} y={y} r={r} />
      ))}
    </svg>
  );
}

function SmallGemIcon() {
  return <img className="step-gem-icon" src="/gem.png" alt="" draggable={false} />;
}

// The Gems screen is reached from all three tabs. It keeps that tab lit, and its back arrow returns there.
const FROM = {
  timeline: {
    background: "/project2-a.png",
    alt: "Brawl Stars style shop screen, Timeline tab",
    backTo: "/timeline",
  },
  assignments: {
    background: "/project2-b.png",
    alt: "Brawl Stars style shop screen, Assignments tab",
    backTo: "/assignments",
  },
  offers: {
    background: "/project2-c.png",
    alt: "Brawl Stars style shop screen, Offers tab",
    backTo: "/offers",
  },
};

/**
 * Gem and coin packs. Used by /gems (from Assignments), /offers/gems (from Offers)
 * and /timeline/gems (from Timeline, when you can't afford a game).
 * Any pack opens the pay wall; PAY there "declines" the card, and closing that
 * message closes the pay wall too.
 */
export default function GemsScreen({ from }: { from: keyof typeof FROM }) {
  const { background, alt, backTo } = FROM[from];
  const [isOpen, setIsOpen] = useState(false);
  const [declined, setDeclined] = useState(false);
  const openerRef = useRef<HTMLButtonElement | null>(null);

  function openPaywall(event: MouseEvent<HTMLButtonElement>) {
    openerRef.current = event.currentTarget;
    setIsOpen(true);
  }

  const handleClosePaywall = useCallback(() => {
    setIsOpen(false);
    openerRef.current?.focus();
  }, []);

  // OK / Esc on "Card declined": back to the packs
  const closeDeclined = useCallback(() => {
    setDeclined(false);
    handleClosePaywall();
  }, [handleClosePaywall]);

  return (
    <div className="stage">
      <img src={background} alt={alt} />

      <div className="gems-overlay" inert={isOpen}>
        {/* Left Container: GEM PACKS */}
        <section className="resource-panel resource-panel--gems" aria-label="Gem Packs">
          <div className="resource-panel-header">
            <span className="bs-text resource-panel-unskew">GEM PACKS</span>
          </div>

          <div className="resource-grid resource-grid--gems">
            {GEM_PACKS.map((pack) => (
              <button
                key={pack.amount}
                type="button"
                className="pack-card pack-card--gem"
                onClick={openPaywall}
                aria-label={`${pack.amount} Gems for ${pack.price}`}
              >
                {pack.ribbon && (
                  <span className="bs-text pack-ribbon">{pack.ribbon}</span>
                )}

                <div className="pack-card-body">
                  <span className="bs-text pack-qty pack-qty--green">
                    {pack.amount}
                  </span>
                  <div className="pack-art">
                    <GemPackArt tier={pack.tier} />
                  </div>
                </div>

                {pack.banner && (
                  <div className="bs-text pack-banner">{pack.banner}</div>
                )}

                <div className="pack-card-footer">
                  <span className="bs-text resource-panel-unskew">{pack.price}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Right Container: COIN PACKS */}
        <section className="resource-panel resource-panel--coins" aria-label="Coin Packs">
          <div className="resource-panel-header">
            <span className="bs-text resource-panel-unskew">COIN PACKS</span>
          </div>

          <div className="resource-grid resource-grid--coins">
            {COIN_PACKS.map((pack) => (
              <button
                key={pack.amount}
                type="button"
                className="pack-card pack-card--coin"
                onClick={openPaywall}
                aria-label={`${pack.amount} Coins for ${pack.gemCost} Gems`}
              >
                <div className="pack-card-body">
                  <span className="bs-text pack-qty pack-qty--gold">
                    {pack.amount}
                  </span>
                  <div className="pack-art">
                    <CoinPackArt tier={pack.tier} />
                  </div>
                </div>

                {pack.banner && (
                  <div className="bs-text pack-banner pack-banner--gold-text">
                    {pack.banner}
                  </div>
                )}

                <div className="pack-card-footer">
                  <div
                    className="resource-panel-unskew"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.4cqw",
                    }}
                  >
                    <SmallGemIcon />
                    <span className="bs-text">{pack.gemCost}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* No `current` tab: every tab, including the lit one, takes you to its page */}
      <ShopNav backTo={backTo} inert={isOpen} />

      {/* While "Card declined" is up, the pay wall behind it can't be clicked or tabbed to */}
      <div style={{ display: "contents" }} inert={declined}>
        <Paywall isOpen={isOpen} onClose={handleClosePaywall} onPay={() => setDeclined(true)} />
      </div>

      <DeclinedPopup isOpen={declined} onClose={closeDeclined} />
    </div>
  );
}

