"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import ConsentPopup from "../components/ConsentPopup";
import Paywall from "../components/Paywall";
import ShopNav from "../components/ShopNav";
import { buyTimelineGame, timelinePurchase, useGems, usePurchased } from "../components/gems";

// The Timeline tab (project2-a): three Supercell games you can buy with gems.
// Clicking one asks "Are you sure?"; YES opens the pay wall, and PAY takes the
// game's price off the gem count. (Only here: the other pay walls don't.)
// Until you've clicked PAY once, every click asks "Are you sure?" again.
// After that your card is "saved": clicking a game buys it straight away.
// Each game can only be bought once: its card then says PURCHASED, and clicking
// it again just shows the game's information (no pop-up, no gems taken).
// Without enough gems, clicking a game goes straight to the Gems page instead.
// (The intro videos play in Deadline Dash, on the way here.)
//
// Buying a game shows it on its own: the star drop's blue backdrop covers the
// shop (only the back button stays), the other two cards slide down out of
// sight, and the bought card moves to the left-hand spot (GUNSHINE.NET's).
// Then its colour grows into a panel down the left side, its name moves to a
// heading on the right ("GUNSHINE.NET - 2011"), and its information pops in
// underneath. Back or Esc plays it all in reverse, back to Timeline.

interface TimelineGame {
  year: number;
  name: string;
  /** Picture in public/timeline/ */
  image: string;
  price: number;
  /** Card colours, see .timeline-card--* in globals.css */
  color: "red" | "green" | "purple";
  /** Paragraphs shown under the heading once it's bought */
  info: string[];
}

const GAMES: TimelineGame[] = [
  {
    year: 2011,
    name: "GUNSHINE.NET",
    image: "/timeline/gunshine.webp",
    price: 333,
    color: "red",
    info: [
      "Gunshine.net was one of Supercell's earlier works and was an MMORPG game that was eventually, effectively shut down due to Supercell's shift in focus towards mobile games.",
      "Although it wasn't the first game in history to introduce microtransactions, it was, however, Supercell's first game to use microtransactions.",
      "Like many games nowadays, the purchasing of microtransactions by the user allowed for upgrades and character customization features (Watts, 2011).",
    ],
  },
  {
    year: 2012,
    name: "HAYDAY",
    image: "/timeline/hayday.jpg",
    price: 333,
    color: "green",
    info: [
      "Hayday, a game everyone is familiar with, was initially launched in 2012 by Supercell and was the turning point in game history. It was inspired by it's earlier farming simulation Facebook website game predecessors e.g. Farmville.",
      "Hayday was reported to have reached a revenue of over a billion USD in 2021, and Supercell integrates features like blended monetization, pay-to-skip design, and skip advertising to contribute to the revenues success.",
      "The game laid out the foundation for future games by inspiring game makers to cater games towards touchscreen users and proved that a game can create unbelievable amounts of revenue (Udonis, 2021).",
    ],
  },
  {
    year: 2016,
    name: "CLASH ROYALE",
    image: "/timeline/clashroyale.jpg",
    price: 333,
    color: "purple",
    info: [
      "Clash Royale, one of Supercell's more recent games, was launched in 2016 and had every feature of microtransactions integrated in the way the game runs (learnt from experience in Supercell's development of Hayday and Clash of Clans).",
      "Heroes, one of the card types introduced in a later update, literally gives the user a guaranteed way to win almost every game through it's \"overpoweredness.\"",
      "But it is clear that Supercell aims to drain users credit cards as these Hero cards are only accessible behind Clash Royale's \"Clash Pass.\"",
      "Proving, how Supercell is going down a never-ending rabbit hole that biases users that make in-app purchases, rather than free-to-play users (Feroz, 2025).",
    ],
  },
];

// The back button cut out of project2-a.png, in design pixels (1920 x 1080)
const BACK_SPOT = { "--x": 0, "--y": 0, "--w": 194, "--h": 136 } as CSSProperties;

function GemIcon() {
  return (
    <svg className="step-gem-icon" viewBox="0 0 36 36" aria-hidden="true">
      <circle cx="18" cy="18" r="16" fill="#22c55e" stroke="#000" strokeWidth="3" />
      <polygon points="18,5 28,13 24,28 12,28 8,13" fill="#86efac" />
      <polygon points="18,9 25,15 22,25 14,25 11,15" fill="#bef264" />
    </svg>
  );
}

export default function TimelinePage() {
  const router = useRouter();
  const gems = useGems();
  const purchased = usePurchased();
  const [popupOpen, setPopupOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  // The card that opened the pop-up, so keyboard focus can go back to it
  const openerRef = useRef<HTMLButtonElement | null>(null);
  // The game being bought
  const gameRef = useRef<TimelineGame | null>(null);

  // The game on show after buying it. It's kept after going back, so its card
  // knows to slide back to its own spot before the other two come up.
  const [shownGame, setShownGame] = useState<TimelineGame | null>(null);
  const [showing, setShowing] = useState(false);
  const backRef = useRef<HTMLButtonElement>(null);
  // The card that opened the information view, so keyboard focus can go back to it
  const showOpenerRef = useRef<HTMLButtonElement | null>(null);

  function showGame(game: TimelineGame) {
    setShownGame(game);
    setShowing(true);
  }

  function clickCard(event: MouseEvent<HTMLButtonElement>, game: TimelineGame) {
    // Only remembered when it was clicked from the keyboard (Enter/Space give detail 0):
    // after a mouse click, focusing it again would leave a white focus outline on the card.
    const fromKeyboard = event.detail === 0 ? event.currentTarget : null;
    // Already yours: show its information again (nothing to pay)
    if (purchased.includes(game.year)) {
      showOpenerRef.current = fromKeyboard;
      showGame(game);
      return;
    }
    // Can't afford it: off to the Gems page (with TIMELINE still lit)
    if (gems < game.price) {
      router.push("/timeline/gems");
      return;
    }
    // Paid before: one click and it's bought
    if (timelinePurchase.hasPaid()) {
      buyTimelineGame(game.year, game.price);
      showOpenerRef.current = fromKeyboard;
      showGame(game);
      return;
    }
    openerRef.current = fromKeyboard;
    gameRef.current = game;
    setPopupOpen(true);
  }

  // Esc, or the X on the pay wall: back to the plain Timeline page
  const closeAll = useCallback(() => {
    setPaywallOpen(false);
    setPopupOpen(false);
  }, []);

  // PAY: the gems come off and the game is yours, then it's shown on its own
  function pay() {
    const game = gameRef.current;
    if (game) {
      buyTimelineGame(game.year, game.price);
      showOpenerRef.current = openerRef.current;
      showGame(game);
    }
    timelinePurchase.markPaid();
    closeAll();
  }

  // Once it has closed (and the cards are clickable again), put keyboard focus back on the card
  useEffect(() => {
    if (popupOpen) return;
    openerRef.current?.focus({ preventScroll: true });
    openerRef.current = null;
  }, [popupOpen]);

  // While a game is on show: focus starts on the back button, and Esc goes back too.
  // Going back, keyboard focus returns to the card that opened it.
  useEffect(() => {
    if (!showing) {
      showOpenerRef.current?.focus({ preventScroll: true });
      showOpenerRef.current = null;
      return;
    }
    backRef.current?.focus({ preventScroll: true });
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setShowing(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showing]);

  const shownIndex = shownGame ? GAMES.indexOf(shownGame) : -1;
  const moved = shownIndex > 0; // HAYDAY or CLASH ROYALE first slide over to the left
  const others = GAMES.filter((game) => game !== shownGame);
  const stageStyle = {
    // The panel grows once the others have gone (and the card has moved over)
    "--expand-delay": moved ? "1.05s" : "0.5s",
    // Going back: the panel shrinks, the card slides home, then the others rise
    "--return-delay": moved ? "0.75s" : "0.4s",
  } as CSSProperties;

  return (
    <div className={`stage timeline-stage${showing ? " is-showing" : ""}`} style={stageStyle}>
      <img src="/project2-a.png" alt="Brawl Stars style shop screen, Timeline tab" />

      {/* Covers the shop while a bought game is on show (same backdrop as the star drop's reward) */}
      <div className="timeline-showcase-bg" aria-hidden="true">
        <div className="sd-pattern" />
      </div>

      <div className="timeline-overlay" inert={popupOpen}>
        <div className="bs-text timeline-title">USE GEMS FOR MORE INFORMATION</div>

        <div className="timeline-track">
          {GAMES.map((game, index) => {
            const bought = purchased.includes(game.year);
            const isShownGame = game === shownGame;
            const onShow = showing && isShownGame;
            // The other two cards drop out of sight while a game is on show
            const away = showing && !isShownGame;
            const cardStyle = {
              "--slot": index,
              "--away-delay": `${Math.max(0, others.indexOf(game)) * 0.07}s`,
            } as CSSProperties;

            return (
              // Not bought yet: asks "Are you sure?". Bought: shows its information.
              // (While it's on show it's the left-hand panel, not a button: only Back works then.)
              <button
                type="button"
                key={game.year}
                className={`timeline-card timeline-card--${game.color}${bought ? " is-purchased" : ""}${
                  isShownGame ? " is-shown-game" : ""
                }${onShow ? " is-on-show" : ""}${away ? " is-away" : ""}`}
                style={cardStyle}
                aria-label={`${game.year}: ${game.name}, ${bought ? "purchased" : `${game.price} gems`}`}
                inert={away || onShow}
                onClick={(event) => clickCard(event, game)}
              >
                {/* The card's colour and dots: grows into the left-hand panel once it's on show */}
                <div className="timeline-card-bg" aria-hidden="true" />

                <div className="timeline-card-header">
                  <span className="bs-text timeline-unskew timeline-year">{game.year}</span>
                </div>

                <div className="timeline-card-body">
                  <div className="timeline-unskew">
                    <img className="timeline-art" src={game.image} alt="" draggable={false} />
                    <div className="bs-text timeline-name">{game.name}</div>
                  </div>
                </div>

                <div className="timeline-card-footer">
                  {/* Always there (whatever it says), so it can fade out and back in */}
                  <div className="timeline-unskew timeline-footer-label">
                    {bought ? (
                      <span className="bs-text timeline-purchased">PURCHASED</span>
                    ) : (
                      <div className="timeline-unskew timeline-price-row">
                        <GemIcon />
                        <span className="bs-text step-price">{game.price}</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* The game on show, on the right of the panel: its name and year, then its information */}
      <section className="timeline-showcase-content" aria-label="Game information">
        <h2 className="bs-text timeline-showcase-title">
          {shownGame && `${shownGame.name} - ${shownGame.year}`}
        </h2>
        <div className="timeline-showcase-info">
          {shownGame?.info.map((paragraph, index) => (
            // --i staggers each paragraph's pop
            <p key={index} style={{ "--i": index } as CSSProperties}>
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      <ShopNav current="timeline" backTo={null} inert={popupOpen || showing} hidden={showing} />

      {/* The only button while a game is on show: back to Timeline */}
      <button
        ref={backRef}
        type="button"
        className="hotspot timeline-showcase-back"
        aria-label="Back to Timeline"
        style={BACK_SPOT}
        onClick={() => setShowing(false)}
      >
        <img src="/timeline/back-button.png" alt="" draggable={false} />
      </button>

      <ConsentPopup
        isOpen={popupOpen}
        panelHidden={paywallOpen}
        onYes={() => setPaywallOpen(true)}
        onClose={closeAll}
      />

      <Paywall isOpen={paywallOpen} onClose={closeAll} onPay={pay} />
    </div>
  );
}
